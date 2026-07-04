import { failureHeatmap, heatmapCategories } from "@rag/data/failureAnalysis";

function cellColor(v: number) {
  if (v === 0) return "bg-slate-50 text-slatey-600";
  if (v <= 1) return "bg-amber-500/15 text-amber-700";
  if (v <= 2) return "bg-orange-500/25 text-orange-100";
  if (v <= 3) return "bg-rose-500/30 text-rose-100";
  return "bg-rose-500/50 text-ink";
}

export function FailureHeatmap() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left text-[11px] font-medium uppercase tracking-wider text-slatey-400">Domain</th>
            {heatmapCategories.map((c) => (
              <th key={c} className="px-2 py-1 text-center text-[11px] font-medium text-slatey-400">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {failureHeatmap.map((row) => (
            <tr key={row.domain}>
              <td className="whitespace-nowrap px-2 py-1 font-medium text-slatey-300">{row.domain}</td>
              {heatmapCategories.map((c) => {
                const v = row.values[c] ?? 0;
                return (
                  <td key={c} className={`rounded-md py-2 text-center font-semibold ${cellColor(v)}`}>
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
