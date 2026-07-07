'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useLens, setLens } from '@gov/lib/lens';
import { toggleSidebar } from '@gov/lib/ui';

const TITLES: { prefix: string; title: string }[] = [
  { prefix: '/live', title: 'See Governance Live' },
  { prefix: '/arcade', title: 'Red Team Arcade' },
  { prefix: '/maturity', title: 'Maturity Index' },
  { prefix: '/readiness', title: 'Regulatory Readiness' },
  { prefix: '/brief', title: 'Board Brief' },
  { prefix: '/value', title: 'Business Case' },
  { prefix: '/use-cases/new', title: 'New Use Case' },
  { prefix: '/use-cases', title: 'Use Case Registry' },
  { prefix: '/risk', title: 'Risk Studio' },
  { prefix: '/policies', title: 'Policy Workbench' },
  { prefix: '/playground', title: 'Runtime Playground' },
  { prefix: '/evals', title: 'Eval Lab' },
  { prefix: '/audit-logs', title: 'Audit Log Explorer' },
  { prefix: '/review-queue', title: 'Human Review Queue' },
  { prefix: '/evidence', title: 'Evidence Center' },
  { prefix: '/settings', title: 'Settings' },
  { prefix: '/docs', title: 'Architecture & Docs' },
];

function titleFor(path: string): string {
  if (path === '/') return 'Executive Cockpit';
  const match = TITLES.find((t) => path.startsWith(t.prefix));
  return match ? match.title : 'AI Governance Control Plane';
}

export function Topbar() {
  const pathname = usePathname();
  const title = titleFor(pathname);
  const isLive = pathname.startsWith('/playground') || pathname.startsWith('/live');
  const lens = useLens();

  useEffect(() => { document.title = `${title} · AI Governance Control Plane`; }, [title]);

  return (
    <header className="sticky top-0 z-20 h-14 bg-white/85 backdrop-blur border-b border-slate-200 flex items-center justify-between px-5 md:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={toggleSidebar} aria-label="Open navigation"
          className="md:hidden -ml-1 p-1.5 rounded-md text-slate-600 hover:bg-slate-100">
          <Menu size={18} />
        </button>
        <h2 className="text-sm font-semibold text-slate-800 truncate">{title}</h2>
        <span className={isLive
          ? 'inline-flex items-center gap-1.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 rounded-full px-2 py-0.5'
          : 'inline-flex items-center gap-1.5 text-[11px] font-medium bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15 rounded-full px-2 py-0.5'}>
          <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {isLive ? 'Live feature' : 'Demo · mock data'}
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px]">
          {(['exec', 'tech'] as const).map((l) => (
            <button key={l} onClick={() => setLens(l)} className={`px-2.5 py-1 rounded-md font-medium transition-colors ${lens === l ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {l === 'exec' ? 'Exec' : 'Tech'}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-medium text-slate-500 bg-slate-50 ring-1 ring-inset ring-slate-500/15 rounded-full px-2 py-0.5">AI_PROVIDER=mock</span>
        <span className="hidden lg:inline text-[11px] font-medium text-brand bg-brand/5 ring-1 ring-inset ring-brand/20 rounded-full px-2 py-0.5">NIST · EU AI Act · ISO 42001</span>
      </div>
    </header>
  );
}
