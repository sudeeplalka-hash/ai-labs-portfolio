// GAP-01 · MCP Server Playground, use cases.
// Payload = a full MCP server manifest (the design IS the lesson) + a crossover
// preset. Healthcare: read + propose-with-approval (write boundary). Retail:
// idempotent mutation. Manufacturing: read-only across the OT/IT line (no writes).

import { type UseCase, assertUseCases, studied } from "../industries";

export type Gap01ArgType = "string" | "number" | "enum";
export interface Gap01Arg { name: string; type: Gap01ArgType; required: boolean; example: string; enumVals?: string[] }
export interface Gap01Tool { name: string; description: string; args: Gap01Arg[]; result: (a: Record<string, string>) => object }
export interface Gap01Resource { uri: string; name: string }
export interface Gap01Prompt { name: string; args: string[] }
export interface Gap01Payload {
  label: string;
  blurb: string;
  tools: Gap01Tool[];
  resources: Gap01Resource[];
  prompts: Gap01Prompt[];
  nSys: number;
  nCon: number;
}

export const GAP01_USE_CASES: UseCase<Gap01Payload>[] = assertUseCases<Gap01Payload>([
  {
    id: "gap01-healthcare-ehr",
    labId: "GAP-01",
    industry: "healthcare",
    provenance: studied,
    title: "Wrap an EHR (FHIR R4) for a care agent",
    oneLiner: "Read clinical data freely; propose orders, never auto-write.",
    context:
      "A care-coordination agent needs an EHR. The MCP server exposes read tools over encounters, labs, and meds, but the only mutation is a propose_order that returns pending clinician approval, PHI stays behind the server and nothing writes to the chart autonomously.",
    theDecision:
      "The design decision is which resources to expose and where the write-approval boundary sits: reads are broad, the single write is a proposal a human ratifies.",
    whatMostMiss:
      "Teams expose a write_order tool 'for convenience' and quietly hand an agent chart-write authority. The boundary is the whole safety design, not a feature flag.",
    stakes: "An autonomous chart write is a patient-safety and liability event; a proposal queued for a clinician is not.",
    takeaway: "Expose reads broadly; make every write a proposal a human ratifies.",
    sources: [
      "HL7 FHIR R4 resource model (encounters, observations, medications)",
      "Clinical human in the loop / order-entry safety patterns",
    ],
    lastVerified: "2026-07-03",
    payload: {
      label: "EHR (FHIR R4)",
      blurb: "Hospital record, read clinical data; propose orders, never auto-write.",
      tools: [
        {
          name: "get_encounter",
          description: "Fetch a patient encounter with linked observations.",
          args: [{ name: "patient_id", type: "string", required: true, example: "PT-8842" }],
          result: (a) => ({ patient_id: a.patient_id, encounter: "ENC-3310", status: "finished", observations: [{ code: "HbA1c", value: "8.1%" }] }),
        },
        {
          name: "propose_order",
          description: "Propose an order for clinician approval (never writes directly).",
          args: [
            { name: "patient_id", type: "string", required: true, example: "PT-8842" },
            { name: "order_type", type: "enum", required: true, example: "medication", enumVals: ["medication", "lab", "imaging"] },
            { name: "detail", type: "string", required: true, example: "Metformin 500mg BID" },
          ],
          result: (a) => ({ proposal_id: "PRP-771", patient_id: a.patient_id, order_type: a.order_type, detail: a.detail, status: "pending_clinician_approval" }),
        },
      ],
      resources: [
        { uri: "fhir://patient/{id}/encounters", name: "Encounters (read)" },
        { uri: "fhir://patient/{id}/medications", name: "Medication list (read)" },
      ],
      prompts: [{ name: "draft_care_summary", args: ["patient_id", "audience"] }],
      nSys: 15,
      nCon: 5,
    },
  },
  {
    id: "gap01-retail-oms",
    labId: "GAP-01",
    industry: "retail",
    provenance: studied,
    title: "Order management + returns as tools",
    oneLiner: "Mutations are idempotent and rate-limited so a retrying agent can't double-refund.",
    context:
      "An order-management system is exposed to a service agent. Reads are open; the one mutation, cancel_order, requires an idempotency key and is rate-limited, so a retrying or looping agent can't issue two refunds for one order.",
    theDecision:
      "Which mutations need idempotency keys and human confirmation: any money-moving or irreversible action gets an idempotency key so retries are safe.",
    whatMostMiss:
      "Everyone tests the happy path. The failure that matters is the agent that retries on a timeout, without idempotency that's a double refund, and it's the server's job to prevent it.",
    stakes: "A double-refund bug at scale is direct margin loss and a reconciliation nightmare.",
    takeaway: "Any money-moving mutation gets an idempotency key, retries must be safe by design.",
    sources: [
      "Order-management / payments API idempotency patterns",
      "Agent retry / at-least-once delivery failure modes",
    ],
    lastVerified: "2026-07-03",
    payload: {
      label: "Order Management API",
      blurb: "OMS + returns, mutations are idempotent and rate-limited.",
      tools: [
        {
          name: "get_order",
          description: "Fetch an order with line items and status.",
          args: [{ name: "order_id", type: "string", required: true, example: "ORD-55210" }],
          result: (a) => ({ order_id: a.order_id, status: "shipped", total_usd: 128.4, items: 3 }),
        },
        {
          name: "cancel_order",
          description: "Cancel/refund an order, idempotent via idempotency_key.",
          args: [
            { name: "order_id", type: "string", required: true, example: "ORD-55210" },
            { name: "idempotency_key", type: "string", required: true, example: "idem-7f3a91" },
          ],
          result: (a) => ({ order_id: a.order_id, status: "cancelled", idempotency_key: a.idempotency_key, note: "idempotent, a retry with the same key is a no-op" }),
        },
      ],
      resources: [
        { uri: "oms://order/{id}", name: "Order record (read)" },
        { uri: "oms://returns/policy", name: "Returns policy (read)" },
      ],
      prompts: [{ name: "draft_return_email", args: ["order_id", "tone"] }],
      nSys: 12,
      nCon: 8,
    },
  },
  {
    id: "gap01-manufacturing-mes",
    labId: "GAP-01",
    industry: "manufacturing",
    provenance: studied,
    title: "MES / historian, read-only across OT/IT",
    oneLiner: "Everything is read-only, the agent can observe the plant, never actuate it.",
    context:
      "A plant-ops copilot sits on the IT side of the OT/IT boundary. The MES/historian server exposes only read tools, machine status, OEE, tag history. There is no write tool at all, so nothing the agent does can actuate equipment.",
    theDecision:
      "Read-only resource design is the OT safety guarantee: the absence of any write tool, not a permission setting, is what makes the copilot safe on the plant floor.",
    whatMostMiss:
      "People add a 'set_setpoint' tool behind an approval and think they're safe. On OT the guarantee people trust is the one that's structurally impossible, no write tool exists.",
    stakes: "A single actuation path from an IT-side agent onto OT equipment is a safety-of-life risk, not an incident ticket.",
    takeaway: "On the OT boundary, safety is a manifest with no write tools, structural, not configured.",
    sources: [
      "OT/IT segmentation (Purdue model) and read-only integration patterns",
      "MES / historian (OPC-UA) data exposure practice",
    ],
    lastVerified: "2026-07-03",
    payload: {
      label: "MES / Historian (read-only)",
      blurb: "Plant systems exposed READ-ONLY across the OT/IT line, no write tools exist.",
      tools: [
        {
          name: "get_machine_status",
          description: "Read a machine's current state and OEE (read-only).",
          args: [{ name: "machine_id", type: "string", required: true, example: "MC-0417" }],
          result: (a) => ({ machine_id: a.machine_id, state: "running", oee: 0.82, alarms: 0 }),
        },
        {
          name: "get_oee",
          description: "Read line-level OEE and its components (read-only).",
          args: [{ name: "line_id", type: "string", required: true, example: "LINE-3" }],
          result: (a) => ({ line_id: a.line_id, oee: 0.79, availability: 0.9, performance: 0.94, quality: 0.93 }),
        },
      ],
      resources: [
        { uri: "mes://line/{id}/status", name: "Line status (read)" },
        { uri: "historian://tag/{id}", name: "Historian tag series (read)" },
      ],
      prompts: [{ name: "summarize_shift", args: ["line_id"] }],
      nSys: 20,
      nCon: 4,
    },
  },
]);
