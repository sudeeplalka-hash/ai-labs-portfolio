// Client side text extraction for uploaded documents.
// Heavy parsers (PDF, DOCX) are dynamically imported so they are only loaded
// when a user actually uploads that file type, they never run during SSR or
// bloat the initial bundle.

export interface ExtractedFile {
  text: string;
  fileType: string;
}

export class FileExtractionError extends Error {}

function extOf(name: string): string {
  return name.toLowerCase().split(".").pop() ?? "txt";
}

// Heuristic: does this string look like real readable text (vs. binary garbage)?
export function looksLikeText(text: string): boolean {
  if (!text || text.trim().length < 20) return false;
  const sample = text.slice(0, 4000);
  let nonPrintable = 0;
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13) continue; // tab, LF, CR
    if (c < 32 || c === 0xfffd) nonPrintable++; // control chars / replacement char
  }
  return nonPrintable / sample.length < 0.15;
}

async function extractDocx(file: File): Promise<string> {
  // mammoth resolves to its browser build via the package "browser" field.
  const mammoth: any = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result?.value ?? "").trim();
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  // Worker is loaded from a version-matched CDN URL (only fetched when parsing a PDF).
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items.map((it: any) => ("str" in it ? it.str : "")).join(" ");
    if (line.trim()) parts.push(line);
  }
  await pdf.destroy?.();
  return parts.join("\n\n").trim();
}

// Extract plain text from an uploaded file. Throws FileExtractionError with a
// user-friendly message on failure.
export async function extractTextFromFile(file: File): Promise<ExtractedFile> {
  const ext = extOf(file.name);
  try {
    if (ext === "pdf") {
      const text = await extractPdf(file);
      if (!looksLikeText(text)) {
        throw new FileExtractionError(
          "Couldn't read selectable text from that PDF. It may be a scanned image, try a text-based PDF, a .docx, or paste the text.",
        );
      }
      return { text, fileType: "pdf" };
    }
    if (ext === "docx") {
      const text = await extractDocx(file);
      if (!looksLikeText(text)) {
        throw new FileExtractionError("That Word file didn't contain readable text. Try another file or paste the text.");
      }
      return { text, fileType: "docx" };
    }
    if (ext === "doc") {
      throw new FileExtractionError("Legacy .doc files aren't supported. Please save it as .docx or .pdf, or paste the text.");
    }
    // Plain text: txt, md, csv, and similar.
    const text = await file.text();
    if (!looksLikeText(text)) {
      throw new FileExtractionError(
        "That file doesn't look like readable text. Supported uploads are .txt, .md, .pdf, and .docx.",
      );
    }
    return { text, fileType: ext };
  } catch (err) {
    if (err instanceof FileExtractionError) throw err;
    throw new FileExtractionError(
      `Couldn't read "${file.name}". Try a .txt, .md, .pdf, or .docx file, or paste the text instead.`,
    );
  }
}

export const SUPPORTED_UPLOAD_ACCEPT =
  ".txt,.md,.markdown,.csv,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
