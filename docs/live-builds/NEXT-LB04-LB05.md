# Live Builds — next two artifacts (build cards)

_2026-07-10, written during the Phase 2–3 overnight run. LB-03 shipped (/builds/eval-bench).
These two were deliberately NOT half-shipped: both need a runtime model download that can only
be verified in a real browser, and the collection's bar is "no untested LIVE claims"._

## LB-04 · Live PII / NER detector

- **Engine:** `@xenova/transformers` (Apache-2.0, verified in reference-repos), model `Xenova/bert-base-NER`
  (quantized ONNX, ~110 MB, lazy-loaded from the HF CDN on explicit user click — never on page load).
- **Page:** `/builds/ner` — paste text → entities (PER/ORG/LOC/MISC) + PII composite; side-by-side with the
  Data lab's tested heuristic engine (`detectPii`/`redactPii` from `@data/lib/prep/engine`) so the model's
  wins/misses vs patterns are the story. Redaction preview toggle.
- **Cross-links:** Data lab corpus PII checks ("pattern-based here → model-based live version");
  governance `pii.json` eval (currently pattern-based — closes that loop).
- **Registry:** `LB-04`, collection 5, live `LIVE` only after a real browser run confirms model load +
  inference; until then keep it OUT of the registry (no dead rows).
- **Deps to add (one pnpm operation, updates lockfile):**
  `pnpm --filter @labs/web add @xenova/transformers@2.17.2`
- **Acceptance:** first inference < 8s after model cached; entities render on the sample paragraph;
  pattern-vs-model disagreement panel shows at least one honest miss in each direction.

## LB-05 · Visual inspection anomaly heatmap

- **Engine:** anomalib (Apache-2.0) PatchCore, trained OFFLINE on the user's machine; exported to ONNX;
  inference in-browser via `onnxruntime-web` (MIT).
- **Dataset:** **VisA** (CC BY 4.0) — chosen over MVTec-AD (CC BY-NC-SA) for license cleanliness. One category
  (e.g. `pcb1`) is enough for the demo.
- **Offline recipe (run on host, not sandbox):**
  1. `pip install anomalib[full]` (or use the reference-repos clone)
  2. `anomalib train --model Patchcore --data anomalib.data.Visa --data.category pcb1`
  3. `anomalib export --model Patchcore --export_type onnx` → `patchcore-pcb1.onnx`
  4. Drop the file at `apps/web/public/models/patchcore-pcb1.onnx` (~30–80 MB; consider Git LFS or Vercel blob)
- **Page:** `/builds/inspection` — upload a part photo (or pick a bundled VisA sample pair) → anomaly heatmap
  overlay + score vs threshold → ship/scrap verdict; real precision/recall of the exported model on the held-out
  split baked in from the training run (numbers come from the recipe output, cited in-page).
- **Registry:** `LB-05` enters only with the model file present and browser-verified.
- **Deps:** `pnpm --filter @labs/web add onnxruntime-web@1.19.2`
