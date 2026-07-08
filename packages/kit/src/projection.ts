// @labs/kit · projection.ts — shared deterministic projection & clustering math.
// Single source of truth, lifted verbatim from lab-rag's embedding projector so
// the Build (chunk-level) and Data (document-level) projections share one engine.
// Everything here is pure, dependency-free, and deterministic (fixed seeds), per
// the honesty doctrine: identical input -> identical picture, every run.

export function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function l2normalize(v: number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n);
  if (n === 0) return v;
  return v.map((x) => x / n);
}

export function dist2(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

/** Top-3 principal components via implicit-covariance power iteration with
 * deflation. Deterministic seed -> identical projection every run. */
export function pca3(rows: number[][], mean: number[]): number[][] {
  const d = mean.length;
  const centered = rows.map((r) => r.map((x, j) => x - mean[j]));

  // C * v  ==  Xc\u1d40 (Xc v)   (no need to materialize the d\u00d7d covariance matrix)
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

/** Fallback layout when there isn't enough signal for a meaningful PCA. */
export function sphereLayout(n: number): { x: number; y: number; z: number }[] {
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

/** Deterministic k-means (k-means++ style seeding from the first vector, then
 * farthest-point) used to group vectors with no external structure. */
export function kmeans(vectors: number[][], k: number, iters = 14): number[] {
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
