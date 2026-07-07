'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@gov/lib/utils';
import {
  LayoutDashboard, FolderOpen, ShieldCheck, TestTube2, ClipboardList, Users, FileText, BookOpen,
  BarChart3, Activity, ShieldHalf, Sparkles, Wallet, Swords, Gauge, Scale, ClipboardCheck, ChevronDown, Settings as SettingsIcon,
} from 'lucide-react';
import { useRole, setRole, ROLES, type Role } from '@gov/lib/rbac';
import { useSidebarOpen, setSidebarOpen } from '@gov/lib/ui';

const HERO = { href: '/live', label: 'See Governance Live', icon: Sparkles };

const GROUPS: { label: string; hint: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: 'Experiences', hint: 'Interactive demos',
    items: [
      { href: '/arcade', label: 'Red Team Arcade', icon: Swords },
      { href: '/value', label: 'Business Case', icon: Wallet },
      { href: '/maturity', label: 'Maturity Index', icon: Gauge },
    ],
  },
  {
    label: 'Control Plane', hint: 'The governed system',
    items: [
      { href: '/', label: 'Executive Cockpit', icon: LayoutDashboard },
      { href: '/use-cases', label: 'Use Case Registry', icon: FolderOpen },
      { href: '/risk', label: 'Risk Studio', icon: BarChart3 },
      { href: '/policies', label: 'Policy Workbench', icon: ShieldCheck },
      { href: '/playground', label: 'Runtime Playground', icon: TestTube2 },
      { href: '/evals', label: 'Eval Lab', icon: Activity },
    ],
  },
  {
    label: 'Assurance', hint: 'Audit · review · evidence',
    items: [
      { href: '/audit-logs', label: 'Audit Log Explorer', icon: ClipboardList },
      { href: '/review-queue', label: 'Human Review Queue', icon: Users },
      { href: '/evidence', label: 'Evidence Center', icon: FileText },
      { href: '/readiness', label: 'Regulatory Readiness', icon: Scale },
      { href: '/brief', label: 'Board Brief', icon: ClipboardCheck },
    ],
  },
  { label: 'Reference', hint: '', items: [{ href: '/settings', label: 'Settings', icon: SettingsIcon }, { href: '/docs', label: 'Architecture & Docs', icon: BookOpen }] },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useRole();
  const open = useSidebarOpen();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const heroActive = isActive(HERO.href);
  const HeroIcon = HERO.icon;

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <>
      <div onClick={() => setSidebarOpen(false)} aria-hidden="true"
        className={cn('fixed inset-0 bg-slate-900/40 z-30 md:hidden transition-opacity', open ? 'opacity-100' : 'opacity-0 pointer-events-none')} />
      <aside className={cn(
        'fixed inset-y-0 left-0 w-64 bg-ink text-slate-300 flex flex-col z-40 transition-transform md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand to-sky-400 flex items-center justify-center shadow-glow shrink-0">
            <ShieldHalf size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Enterprise</p>
            <h1 className="text-sm font-semibold text-white">AI Governance</h1>
          </div>
        </div>

        <nav className="flex-1 px-3 pb-4 space-y-4 overflow-y-auto">
          <Link href={HERO.href}
            className={cn('block rounded-xl p-3 ring-1 transition-colors', heroActive ? 'bg-white/12 ring-sky-400/60' : 'bg-white/5 ring-white/10 hover:bg-white/10')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center shrink-0">
                <HeroIcon size={16} className="text-sky-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white">{HERO.label}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Ungoverned vs governed</p>
              </div>
              <span className="text-[10px] font-semibold text-sky-300 bg-sky-500/15 rounded-full px-2 py-0.5">Try</span>
            </div>
          </Link>

          {GROUPS.map((group) => {
            const isCollapsed = collapsed[group.label];
            return (
              <div key={group.label}>
                <button onClick={() => setCollapsed((c) => ({ ...c, [group.label]: !c[group.label] }))}
                  className="w-full flex items-center justify-between px-2 mb-1 group">
                  <span className="text-left">
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{group.label}</span>
                    {group.hint && <span className="block text-[10px] text-slate-600">{group.hint}</span>}
                  </span>
                  <ChevronDown size={13} className={cn('text-slate-600 transition-transform', isCollapsed ? '-rotate-90' : '')} />
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {group.items.map(({ href, label, icon: Icon }) => {
                      const active = isActive(href);
                      return (
                        <Link key={href} href={href}
                          className={cn('flex items-center gap-3 pl-3 pr-3 py-2 rounded-md text-sm font-medium border-l-2 transition-colors',
                            active ? 'bg-white/12 text-white border-sky-400' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white')}>
                          <Icon size={16} />
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/10">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Viewing as</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 w-full bg-white/5 text-slate-200 text-xs rounded-lg border border-white/10 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400">
            {ROLES.map((r) => <option key={r.id} value={r.id} className="bg-ink">{r.label}</option>)}
          </select>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">{ROLES.find((r) => r.id === role)?.blurb}</p>
        </div>
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <p className="text-xs text-slate-400">All systems operational</p>
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5">v1.2.0 · Mock mode · no API key</p>
        </div>
      </aside>
    </>
  );
}
