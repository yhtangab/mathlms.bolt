import type { ReactNode } from 'react';
import { GraduationCap, LogOut, Presentation, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Avatar from '@/components/Avatar';
import type { Member, Role } from '@/types';

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type AppShellProps = {
  role: Role;
  onRoleChange: (role: Role) => void;
  navItems: NavItem[];
  activePage: string;
  onNavigate: (id: string) => void;
  member: Member;
  onSignOut: () => void;
  children: ReactNode;
};

const ROLE_OPTIONS: Array<{ role: Role; label: string; Icon: LucideIcon }> = [
  { role: 'student', label: 'Student', Icon: UserRound },
  { role: 'teacher', label: 'Teacher', Icon: Presentation },
];

export default function AppShell({
  role,
  onRoleChange,
  navItems,
  activePage,
  onNavigate,
  member,
  onSignOut,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-slate-50 to-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-press-primary">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-base font-extrabold text-slate-900">HLC Math</p>
              <p className="truncate text-xs font-bold text-primary-700">HLC Secondary Mathematics</p>
            </div>
          </div>

          <nav aria-label="Main" className="hidden items-center gap-1 rounded-2xl bg-slate-100 p-1 md:flex">
            {navItems.map((item) => {
              const active = activePage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    active ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div role="group" aria-label="Switch view" className="flex items-center rounded-full border border-slate-200 bg-white p-1">
              {ROLE_OPTIONS.map(({ role: option, label, Icon }) => {
                const active = role === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onRoleChange(option)}
                    aria-pressed={active}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      active ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">{label} view</span>
                    <span className="sm:hidden">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 lg:flex">
              <Avatar name={member.full_name} size="sm" tone={member.role === 'teacher' ? 'secondary' : 'primary'} />
              <div className="leading-tight">
                <p className="max-w-[9rem] truncate text-xs font-extrabold text-slate-900">{member.full_name}</p>
                <p className="text-[11px] font-bold text-slate-500">{member.set_code ?? 'Teacher'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-error-300 hover:text-error-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 md:pb-16">{children}</main>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
      >
        <div className="mx-auto grid max-w-md px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
          {navItems.map((item) => {
            const active = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-extrabold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  active ? 'text-primary-700' : 'text-slate-500'
                }`}
              >
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${active ? 'bg-primary-100' : ''}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
