import { CHAPTER_COUNT } from '@/lib/analytics';
import { normalizeEmail } from '@/lib/session';

export type CsvScoreRow = {
  line: number;
  email: string;
  chapter_no: number | null;
  score: number | null;
  error: string | null;
};

export function parseScoreCsv(text: string, knownEmails: Set<string>): CsvScoreRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows = lines.map((line, index) => {
    const [rawEmail = '', rawChapter = '', rawScore = ''] = line.split(',').map((cell) => cell.trim());
    return { line: index + 1, rawEmail, rawChapter, rawScore };
  });

  const body = rows.length > 0 && rows[0].rawEmail.toLowerCase() === 'email' ? rows.slice(1) : rows;

  return body.map(({ line, rawEmail, rawChapter, rawScore }) => {
    const email = normalizeEmail(rawEmail);
    const chapter = Number(rawChapter);
    const score = rawScore === '' ? NaN : Number(rawScore);

    let error: string | null = null;
    if (!knownEmails.has(email)) error = 'Email is not on the class roster';
    else if (!Number.isInteger(chapter) || chapter < 1 || chapter > CHAPTER_COUNT) error = `Chapter must be 1 to ${CHAPTER_COUNT}`;
    else if (!Number.isFinite(score) || score < 0 || score > 100) error = 'Score must be between 0 and 100';

    return {
      line,
      email,
      chapter_no: Number.isInteger(chapter) && chapter >= 1 && chapter <= CHAPTER_COUNT ? chapter : null,
      score: error === null ? score : null,
      error,
    };
  });
}
