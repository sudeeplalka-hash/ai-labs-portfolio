import type { DocumentChunk } from "@rag/types/liveLab";
import { contentWords } from "./textUtils";
import { buildBoilerplateSet } from "./boilerplate";

// Deterministic "embedding" projector for the 3D visualizer.
//
// v1 builds a TF-IDF term vector per chunk and reduces it to 3D with PCA, fully
// local, instant, and deterministic. The SAME interface (vectorize -> project)
// is what a neural embedding model (MiniLM, OpenAI, etc.) would plug into later.

const MAX_DIMS = 200;

const GENERIC_STOP = new Set([
  "his", "her", "him", "she", "hers", "also", "such", "may", "one", "two", "three",
  "first", "second", "third", "new", "used", "using", "use", "would", "could",
  "company", "companies", "many", "much", "well", "even", "make", "made", "way",
  "time", "year", "years", "however", "therefore", "thus", "within", "around",
  "page", "pages", "exhibit", "source", "figure", "table", "appendix", "note",
  "https", "http", "www", "com", "really", "things", "thing", "lot", "able", "going",
]);

export interface ProjectedPoint {
  chunkId: string;
  chunkIndex: number;
  section: string;
  x: number;
  y: number;
  z: number;
}

export interface SectionColor {
  label: string;
  color: string;
}

export interface KeywordPoint {
  text: string;
  x: number;
  y: number;
  z: number;
  weight: number;
}

export interface ProjectorModel {
  points: ProjectedPoint[];
  sections: SectionColor[];
  colorBy: "section" | "topic";
  colorOf: (section: string) => string;
  keywordPoints: KeywordPoint[];
  projectText: (text: string) => { x: number; y: number; z: number };
}

// A calm, distinct palette for section coloring.
// Calm, editorial palette that reads well on a light background.
const PALETTE = [
  "#4a9d4a", "#e8943a", "#3d7ab5", "#3f9c8f", "#7c6cae",
  "#cf6b4a", "#c2a23a", "#5b8bd0", "#5fa86b", "#a0863a",
  "#6c8cae", "#d08a3a",
];

function l2normalize(v: number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n);
  if (n === 0) return v;
  return v.map((x) => x / n);
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// Build vocabulary (top terms by document frequency) and IDF weights.
function buildVocab(
  chunkWords: string[][],
  stop: Set<string>,
): { vocab: string[]; index: Map<string, number>; idf: number[]; df: Map<string, number> } {
  const df = new Map<string, number>();
  for (const words of chunkWords) {
    for (const w of new Set(words)) df.set(w, (df.get(w) ?? 0) + 1);
  }
  const N = chunkWords.length;
  const vocab = [...df.entries()]
    .filter(([w, n]) => n >= 1 && n < N && !stop.has(w) && !/\d/.test(w) && w.length > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_DIMS)
    .map(([w]) => w);
  const index = new Map(vocab.map((w, i) => [w, i]));
  const idf = vocab.map((w) => Math.log((N + 1) / ((df.get(w) ?? 0) + 1)) + 1);
  return { vocab, index, idf, df };
}

function tfidfVector(words: string[], index: Map<string, number>, idf: number[]): number[] {
  const v = new Array(idf.length).fill(0);
  for (const w of words) {
    const i = index.get(w);
    if (i !== undefined) v[i] += 1;
  }
  for (let i = 0; i < v.length; i++) v[i] *= idf[i];
  return l2normalize(v);
}

// Top-3 principal components via implicit-covariance power iteration with
// deflation. Deterministic seed -> identical projection every run.
function pca3(rows: number[][], mean: number[]): number[][] {
  const d = mean.length;
  const centered = rows.map((r) => r.map((x, j) => x - mean[j]));

  // C * v  ==  Xcᵀ (Xc v)   (no need to materialize the d×d covariance matrix)
  const covMatVec = (v: number[]): number[] => {
    const u = centered.map((row) => dot(row, v)); // length n
    const w = new Array(d).fill(0);
    for (let i = 0; i < centered.length; i++) {
      const ui = u[i];
      const row = centered[i];
      for (let j = 0; j < d; j++) w[j] += row[j] * ui;
    }
    return w;
  };

  const comps: number[][] = [];
  for (let k = 0; k < 3; k++) {
    // deterministic seed, distinct per component
    let v = new Array(d).fill(0).map((_, j) => Math.cos((j + 1) * (k + 1) * 0.7) + 0.001 * ((j % 7) - 3));
    const orthogonalize = (vec: number[]) => {
      for (const c of comps) {
        const p = dot(vec, c);
        for (let j = 0; j < d; j++) vec[j] -= p * c[j];
      }
      return vec;
    };
    let norm = Math.sqrt(dot(v, v)) || 1;
    v = v.map((x) => x / norm);
    for (let iter = 0; iter < 90; iter++) {
      let w = covMatVec(v);
      w = orthogonalize(w);
      norm = Math.sqrt(dot(w, w));
      if (norm < 1e-9) break;
      v = w.map((x) => x / norm);
    }
    comps.push(v);
  }
  return comps;
}

// Fallback layout when there isn't enough signal for a meaningful PCA.
function sphereLayout(n: number): { x: number; y: number; z: number }[] {
  const out: { x: number; y: number; z: number }[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = golden * i;
    out.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r });
  }
  return out;
}

function dist2(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

// Deterministic k-means (k-means++ style seeding from the first vector, then
// farthest-point) used to color documents that have no clear section structure.
function kmeans(vectors: number[][], k: number, iters = 14): number[] {
  const n = vectors.length;
  const d = vectors[0]?.length ?? 0;
  if (n === 0 || d === 0) return new Array(n).fill(0);
  const centroids: number[][] = [vectors[0].slice()];
  while (centroids.length < k) {
    let best = -1;
    let bi = 0;
    for (let i = 0; i < n; i++) {
      let dmin = Infinity;
      for (const c of centroids) dmin = Math.min(dmin, dist2(vectors[i], c));
      if (dmin > best) {
        best = dmin;
        bi = i;
      }
    }
    centroids.push(vectors[bi].slice());
  }
  const assign = new Array(n).fill(0);
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < n; i++) {
      let dmin = Infinity;
      let ai = 0;
      for (let c = 0; c < k; c++) {
        const dd = dist2(vectors[i], centroids[c]);
        if (dd < dmin) {
          dmin = dd;
          ai = c;
        }
      }
      assign[i] = ai;
    }
    const sums = Array.from({ length: k }, () => new Array(d).fill(0));
    const cnt = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const a = assign[i];
      cnt[a]++;
      const v = vectors[i];
      for (let j = 0; j < d; j++) sums[a][j] += v[j];
    }
    for (let c = 0; c < k; c++) if (cnt[c] > 0) for (let j = 0; j < d; j++) centroids[c][j] = sums[c][j] / cnt[c];
  }
  return assign;
}

// Label a cluster by its two highest-weight vocabulary terms.
function clusterLabel(memberVectors: number[][], vocab: string[]): string {
  const d = vocab.length;
  const sum = new Array(d).fill(0);
  for (const v of memberVectors) for (let j = 0; j < d; j++) sum[j] += v[j];
  const top = sum
    .map((w, j) => [w, j] as [number, number])
    .sort((a, b) => b[0] - a[0])
    .slice(0, 2)
    .filter(([w]) => w > 0)
    .map(([, j]) => vocab[j]);
  return top.length ? top.join(" · ") : "Topic";
}

export function buildProjector(chunks: DocumentChunk[]): ProjectorModel {
  const sectionsSeen: string[] = [];
  const sectionOf = (c: DocumentChunk) => (c.heading && c.heading.trim() ? c.heading.trim() : "Document body");
  for (const c of chunks) {
    const s = sectionOf(c);
    if (!sectionsSeen.includes(s)) sectionsSeen.push(s);
  }
  const sections: SectionColor[] = sectionsSeen.map((label, i) => ({ label, color: PALETTE[i % PALETTE.length] }));
  const colorMap = new Map(sections.map((s) => [s.label, s.color]));
  const colorOf = (section: string) => colorMap.get(section) ?? PALETTE[0];

  const cleanWords = (text: string) =>
    contentWords(text)
      .map((w) => w.replace(/[^a-z]/g, ""))
      .filter((w) => w.length > 2);
  const chunkWords = chunks.map((c) => cleanWords(c.text));

  // Exclude boilerplate words (from repeated footers) and generic filler from the
  // vocabulary so cluster labels surface real topical terms.
  const repeated = buildBoilerplateSet(chunks.map((c) => c.text));
  const stop = new Set<string>(GENERIC_STOP);
  for (const key of repeated) for (const w of key.split(" ")) if (w.length > 2) stop.add(w);
  const { vocab, index, idf, df } = buildVocab(chunkWords, stop);
  const vectors = chunkWords.map((w) => tfidfVector(w, index, idf));
  const d = idf.length;

  const mean = new Array(d).fill(0);
  for (const v of vectors) for (let j = 0; j < d; j++) mean[j] += v[j];
  for (let j = 0; j < d; j++) mean[j] /= Math.max(1, vectors.length);

  let coords: { x: number; y: number; z: number }[];
  let comps: number[][] | null = null;
  let scale = 1;

  if (chunks.length >= 4 && d >= 3) {
    comps = pca3(vectors, mean);
    coords = vectors.map((v) => {
      const c = v.map((x, j) => x - mean[j]);
      return { x: dot(c, comps![0]), y: dot(c, comps![1]), z: dot(c, comps![2]) };
    });
    let maxAbs = 0;
    for (const p of coords) maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
    scale = maxAbs || 1;
    coords = coords.map((p) => ({ x: p.x / scale, y: p.y / scale, z: p.z / scale }));
  } else {
    coords = sphereLayout(chunks.length);
  }

  // Color by real sections when the document has clear structure; otherwise fall
  // back to labeled topic clusters so the visual is always meaningfully colorful.
  const distinctSections = sections.length;
  let colorBy: "section" | "topic" = "section";
  let pointSection: string[] = chunks.map((c) => sectionOf(c));
  let finalSections: SectionColor[] = sections;

  if ((distinctSections < 3 || distinctSections > 10) && chunks.length >= 6 && d >= 3) {
    colorBy = "topic";
    const k = Math.min(6, Math.max(3, Math.round(chunks.length / 10)));
    const assign = kmeans(vectors, k);
    const labels: string[] = [];
    for (let c = 0; c < k; c++) {
      const members = vectors.filter((_, i) => assign[i] === c);
      labels.push(members.length ? clusterLabel(members, vocab) : `Topic ${c + 1}`);
    }
    // Deduplicate identical labels
    const seenLabel = new Map<string, number>();
    const uniqueLabels = labels.map((l) => {
      const n2 = (seenLabel.get(l) ?? 0) + 1;
      seenLabel.set(l, n2);
      return n2 > 1 ? `${l} (${n2})` : l;
    });
    finalSections = uniqueLabels
      .map((label, i) => ({ label, color: PALETTE[i % PALETTE.length] }))
      .filter((_, i) => assign.includes(i));
    pointSection = assign.map((a) => uniqueLabels[a]);
  }

  const finalColorMap = new Map(finalSections.map((s2) => [s2.label, s2.color]));
  const finalColorOf = (section: string) => finalColorMap.get(section) ?? PALETTE[0];

  const points: ProjectedPoint[] = chunks.map((c, i) => ({
    chunkId: c.id,
    chunkIndex: c.chunkIndex,
    section: pointSection[i],
    x: coords[i]?.x ?? 0,
    y: coords[i]?.y ?? 0,
    z: coords[i]?.z ?? 0,
  }));

  const projectText = (text: string) => {
    if (!comps) return { x: 0, y: 0, z: 0 };
    const v = tfidfVector(cleanWords(text), index, idf);
    const c = v.map((x, j) => x - mean[j]);
    return { x: dot(c, comps[0]) / scale, y: dot(c, comps[1]) / scale, z: dot(c, comps[2]) / scale };
  };

  // Project the document's top keywords into the SAME space (a word-map view).
  // A keyword's vector is the unit vector at its vocabulary dimension, so terms
  // with similar PCA loadings (i.e. that co-occur) end up near each other.
  let keywordPoints: KeywordPoint[] = [];
  if (comps) {
    const meanProj = [0, 1, 2].map((k) => dot(mean, comps![k]));
    const raw = vocab.slice(0, 24).map((w) => {
      const i = index.get(w)!;
      return { text: w, x: comps![0][i] - meanProj[0], y: comps![1][i] - meanProj[1], z: comps![2][i] - meanProj[2], weight: df.get(w) ?? 1 };
    });
    let kmax = 0;
    for (const r of raw) kmax = Math.max(kmax, Math.abs(r.x), Math.abs(r.y), Math.abs(r.z));
    const ks = (kmax || 1) * 1.1;
    keywordPoints = raw.map((r) => ({ text: r.text, x: r.x / ks, y: r.y / ks, z: r.z / ks, weight: r.weight }));
  }

  return { points, sections: finalSections, colorBy, colorOf: finalColorOf, keywordPoints, projectText };
}
