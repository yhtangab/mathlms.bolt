import { useMemo, useState } from 'react';
import { BookOpen, ChartColumn, FileSpreadsheet, LayoutDashboard, Trophy, Upload, ClipboardList } from 'lucide-react';
import AppShell, { type NavItem } from '@/components/AppShell';
import StatusMessage from '@/components/StatusMessage';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchLmsSnapshot } from '@/lib/api';
import { buildStudentStats, type StudentStats } from '@/lib/analytics';
import ChapterPage from '@/pages/student/ChapterPage';
import LeaderboardPage from '@/pages/student/LeaderboardPage';
import StudentDashboardPage from '@/pages/student/StudentDashboardPage';
import ContentRoomPage from '@/pages/teacher/ContentRoomPage';
import ScoreImportPage from '@/pages/teacher/ScoreImportPage';
import ScoreMasterPage from '@/pages/teacher/ScoreMasterPage';
import TeacherOverviewPage from '@/pages/teacher/TeacherOverviewPage';
import type { LmsSnapshot, Member, Role } from '@/types';

const STUDENT_NAV: NavItem[] = [
  { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { id: 'courses', label: 'Chapter', icon: BookOpen },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

const TEACHER_NAV: NavItem[] = [
  { id: 'overview', label: 'Class Overview', icon: ChartColumn },
  { id: 'scores', label: 'Score Table', icon: ClipboardList },
  { id: 'import', label: 'Import Scores', icon: FileSpreadsheet },
  { id: 'content', label: 'Content Room', icon: Upload },
];

const DEFAULT_PAGE: Record<Role, string> = { student: 'dashboard', teacher: 'overview' };

type LmsWorkspaceProps = {
  member: Member;
  onSignOut: () => void;
};

export default function LmsWorkspace({ member, onSignOut }: LmsWorkspaceProps) {
  const [viewRole, setViewRole] = useState<Role>(member.role);
  const [page, setPage] = useState(DEFAULT_PAGE[member.role]);
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  const { data, error, loading, reload } = useAsyncData(fetchLmsSnapshot, []);

  const stats = useMemo(() => (data ? buildStudentStats(data) : []), [data]);

  const handleRoleChange = (role: Role) => {
    setViewRole(role);
    setPage(DEFAULT_PAGE[role]);
  };

  const navItems = viewRole === 'student' ? STUDENT_NAV : TEACHER_NAV;

  return (
    <AppShell
      role={viewRole}
      onRoleChange={handleRoleChange}
      navItems={navItems}
      activePage={page}
      onNavigate={setPage}
      member={member}
      onSignOut={onSignOut}
    >
      {!data && loading && <StatusMessage variant="loading" message="Loading your class data..." />}
      {!data && error && <StatusMessage variant="error" message={error} onRetry={reload} />}
      {data && (
        <WorkspacePage
          snapshot={data}
          stats={stats}
          viewRole={viewRole}
          page={page}
          member={member}
          previewStudentId={previewStudentId}
          onPreviewChange={setPreviewStudentId}
          onReload={reload}
        />
      )}
    </AppShell>
  );
}

type WorkspacePageProps = {
  snapshot: LmsSnapshot;
  stats: StudentStats[];
  viewRole: Role;
  page: string;
  member: Member;
  previewStudentId: string | null;
  onPreviewChange: (id: string) => void;
  onReload: () => void;
};

function WorkspacePage({
  snapshot,
  stats,
  viewRole,
  page,
  member,
  previewStudentId,
  onPreviewChange,
  onReload,
}: WorkspacePageProps) {
  if (viewRole === 'teacher') {
    switch (page) {
      case 'scores':
        return <ScoreMasterPage stats={stats} onReload={onReload} />;
      case 'import':
        return <ScoreImportPage stats={stats} onReload={onReload} />;
      case 'content':
        return <ContentRoomPage snapshot={snapshot} onReload={onReload} />;
      default:
        return <TeacherOverviewPage stats={stats} snapshot={snapshot} />;
    }
  }

  const defaultStudentId = stats.find((entry) => entry.student.set_code === 'S2M3')?.student.id ?? stats[0]?.student.id;
  const viewerIsStudent = member.role === 'student';
  const viewedId = viewerIsStudent ? member.id : previewStudentId ?? defaultStudentId;
  const viewed = stats.find((entry) => entry.student.id === viewedId);

  const preview = !viewerIsStudent && (
    <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-slate-600">Teacher preview: choose which student's dashboard to view.</p>
      <select
        aria-label="Preview student"
        value={viewedId ?? ''}
        onChange={(event) => onPreviewChange(event.target.value)}
        className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:border-primary-500 focus:outline-none"
      >
        {stats.map((entry) => (
          <option key={entry.student.id} value={entry.student.id}>
            {entry.student.full_name} ({entry.student.set_code})
          </option>
        ))}
      </select>
    </div>
  );

  if (!viewed) {
    return <StatusMessage variant="error" message="No student profile is available to show." />;
  }

  return (
    <>
      {preview}
      {page === 'courses' && <ChapterPage snapshot={snapshot} viewed={viewed} />}
      {page === 'leaderboard' && <LeaderboardPage stats={stats} viewerId={viewed.student.id} />}
      {page === 'dashboard' && <StudentDashboardPage snapshot={snapshot} viewed={viewed} />}
    </>
  );
}
