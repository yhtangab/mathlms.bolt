import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ASSESSMENT_TYPES = ["short_quiz", "chapter_quiz", "term_test", "exam", "mock", "homework"];
const REQUIRED_HEADERS = ["student", "assessment_type", "title", "score"];

type SheetRow = {
  line: number;
  student: string;
  assessment_type: string;
  title: string;
  score: number;
  max_score: number;
  taken_on: string | null;
};

type Member = { id: string; email: string; hlc_number: string | null };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseSheet(text: string): { rows: SheetRow[]; problems: Array<{ line: number; reason: string }> } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [], problems: [] };

  const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const missing = REQUIRED_HEADERS.filter((name) => !header.includes(name));
  if (missing.length > 0) {
    return { rows: [], problems: [{ line: 1, reason: `Missing column: ${missing.join(", ")}` }] };
  }

  const col = (name: string) => header.indexOf(name);
  const rows: SheetRow[] = [];
  const problems: Array<{ line: number; reason: string }> = [];

  lines.slice(1).forEach((raw, index) => {
    const line = index + 2;
    const cells = parseCsvLine(raw);
    const get = (name: string) => (col(name) >= 0 ? cells[col(name)] ?? "" : "");

    const student = get("student");
    const type = get("assessment_type").toLowerCase();
    const title = get("title");
    const score = Number(get("score"));
    const maxRaw = get("max_score");
    const max_score = maxRaw === "" ? 100 : Number(maxRaw);
    const takenRaw = get("date");
    const taken_on = takenRaw === "" ? null : takenRaw;

    if (!student) return problems.push({ line, reason: "Student is blank" });
    if (!ASSESSMENT_TYPES.includes(type)) return problems.push({ line, reason: "Unknown assessment type" });
    if (!title || title.length > 120) return problems.push({ line, reason: "Title is missing or too long" });
    if (!Number.isFinite(score) || score < 0) return problems.push({ line, reason: "Score must be a number of 0 or more" });
    if (!Number.isFinite(max_score) || max_score <= 0 || score > max_score) {
      return problems.push({ line, reason: "Max score must be above 0 and at least the score" });
    }
    if (taken_on !== null && !/^\d{4}-\d{2}-\d{2}$/.test(taken_on)) {
      return problems.push({ line, reason: "Date must look like 2026-09-30" });
    }

    rows.push({ line, student, assessment_type: type, title, score, max_score, taken_on });
  });

  return { rows, problems };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const sheetUrl = Deno.env.get("SCORE_SHEET_CSV_URL");
    if (!sheetUrl) {
      return json({ error: "The score sheet link is not set up yet." }, 500);
    }

    const sheetResponse = await fetch(sheetUrl);
    if (!sheetResponse.ok) {
      return json({ error: `Could not read the score sheet (status ${sheetResponse.status}).` }, 502);
    }
    const { rows, problems } = parseSheet(await sheetResponse.text());

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: members, error: membersError } = await supabase
      .from("s2_members")
      .select("id, email, hlc_number")
      .eq("role", "student");
    if (membersError) throw membersError;

    const byEmail = new Map<string, Member>();
    const byHlc = new Map<string, Member>();
    for (const member of (members ?? []) as Member[]) {
      byEmail.set(member.email.toLowerCase(), member);
      if (member.hlc_number) byHlc.set(member.hlc_number.trim().toLowerCase(), member);
    }

    const upserts: Array<Record<string, unknown>> = [];
    const unmatched: Array<{ line: number; student: string }> = [];
    for (const row of rows) {
      const key = row.student.toLowerCase();
      const member = byEmail.get(key) ?? byHlc.get(key);
      if (!member) {
        unmatched.push({ line: row.line, student: row.student });
        continue;
      }
      upserts.push({
        student_id: member.id,
        assessment_type: row.assessment_type,
        title: row.title,
        score: row.score,
        max_score: row.max_score,
        taken_on: row.taken_on,
        updated_at: new Date().toISOString(),
      });
    }

    if (upserts.length > 0) {
      const { error: upsertError } = await supabase
        .from("s2_assessments")
        .upsert(upserts, { onConflict: "student_id,assessment_type,title" });
      if (upsertError) throw upsertError;
    }

    return json({
      synced: upserts.length,
      unmatched,
      invalid: problems,
      synced_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("sync-score-sheet failed", err);
    return json({ error: "The sync could not finish. Please try again." }, 500);
  }
});
