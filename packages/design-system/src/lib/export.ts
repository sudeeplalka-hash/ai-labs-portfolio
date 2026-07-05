// Export & artifact helpers shared across labs. The pure parts (CSV, scenario JSON)
// are unit-tested; the download / canvas / clipboard helpers are thin DOM wrappers
// used client-side. Everything runs in the browser — no backend — honest to the
// static deployment.

/** Quote a CSV field only when it contains a comma, quote, or newline (RFC-4180-ish). */
function escapeCsv(v: string | number | boolean | null | undefined): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV string (CRLF rows) from headers + rows. Pure. */
export function toCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  return [headers, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\r\n");
}

/** Serialize a scenario object to pretty JSON. Pure. */
export function scenarioToJson(scenario: unknown): string {
  return JSON.stringify(scenario, null, 2);
}

/** Parse scenario JSON. Throws on malformed input — callers should try/catch. Pure. */
export function parseScenarioJson<T = unknown>(text: string): T {
  return JSON.parse(text) as T;
}

/* ---------------- DOM helpers (browser only) ---------------- */

/** Trigger a client-side download of a text blob. */
export function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Download tabular data as a .csv file. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): void {
  const name = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  downloadText(name, toCsv(headers, rows), "text/csv;charset=utf-8");
}

/** Download an object as a pretty .json file. */
export function downloadJson(filename: string, obj: unknown): void {
  const name = filename.endsWith(".json") ? filename : `${filename}.json`;
  downloadText(name, scenarioToJson(obj), "application/json;charset=utf-8");
}

/** Copy text to the clipboard; resolves true on success, false if blocked. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Rasterize an inline <svg> to a PNG and download it. Serializes the live SVG,
 *  draws it onto a white canvas at `scale`×, and exports a blob. Resolves false if
 *  the browser can't complete the raster. */
export function svgElementToPng(svg: SVGSVGElement, filename: string, scale = 2): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const vb = svg.viewBox?.baseVal;
      const w = vb && vb.width ? vb.width : svg.clientWidth || 640;
      const h = vb && vb.height ? vb.height : svg.clientHeight || 400;
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", String(w));
      clone.setAttribute("height", String(h));
      const data = new XMLSerializer().serializeToString(clone);
      const svgUrl = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) { URL.revokeObjectURL(svgUrl); resolve(false); return; }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(svgUrl);
        canvas.toBlob((blob) => {
          if (!blob) { resolve(false); return; }
          const name = filename.endsWith(".png") ? filename : `${filename}.png`;
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(pngUrl), 0);
          resolve(true);
        }, "image/png");
      };
      img.onerror = () => { URL.revokeObjectURL(svgUrl); resolve(false); };
      img.src = svgUrl;
    } catch {
      resolve(false);
    }
  });
}

/** Open a file picker and resolve the chosen file's text (or null if cancelled). */
export function pickTextFile(accept = "application/json,.json"): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
