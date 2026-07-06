// GAP-04 · Tool use & Structured Output, use cases.
// Payload = a full extraction sample (raw text → schema → attempt/retry → final).
// Healthcare RCM: a laterality/modifier mismatch caught before the claim writes.
// Logistics: a clean shipment-exception parse. Real estate: null-and-flag a value
// that isn't in the document instead of hallucinating it.

import { type UseCase, assertUseCases, studied } from "../industries";

export interface Gap04Field { name: string; type: string; required: boolean }
export interface Gap04Payload {
  label: string;
  raw: string;
  schema: Gap04Field[];
  hard: boolean;
  attempt1?: object;
  errors?: string[];
  retryNote?: string;
  final: object;
}

export const GAP04_USE_CASES: UseCase<Gap04Payload>[] = assertUseCases<Gap04Payload>([
  {
    id: "gap04-healthcare-rcm",
    labId: "GAP-04",
    industry: "healthcare",
    provenance: studied,
    title: "Clinical note → claim codes",
    oneLiner: "A wrong-side modifier is caught by the gate before the claim writes.",
    context:
      "A revenue-cycle agent extracts ICD-10/CPT codes, modifiers, and payer from a clinical note. The first pass applies a left-side modifier to a right-knee film; the schema/consistency gate catches the laterality mismatch and forces a corrective retry.",
    theDecision:
      "The validation gate sits between the model and the claim write, a mis-coded laterality is a denial or an audit finding, so nothing writes to the claim until it validates.",
    whatMostMiss:
      "People check that the JSON parses, not that it's consistent with the note. On RCM the expensive errors are consistent-looking but clinically wrong, wrong side, wrong modifier.",
    stakes: "A mis-coded claim is a denial at best and a compliance/audit exposure at worst, at scale that's real leakage.",
    takeaway: "Put the validation gate before the claim write, parse-valid isn't the same as clinically consistent.",
    sources: [
      "Revenue-cycle coding (ICD-10/CPT, modifiers, laterality) patterns",
      "Structured-extraction validation + corrective-retry practice",
    ],
    lastVerified: "2026-07-03",
    payload: {
      label: "Clinical note → claim codes",
      raw: "Pt seen for f/u of T2DM, poorly controlled, A1c 8.1. Also c/o right knee pain, likely OA. Ordered A1c recheck and a right knee XR, 2 views. Plan: increase metformin. Office visit.",
      schema: [
        { name: "dx_codes", type: "string[] (ICD-10)", required: true },
        { name: "procedures", type: "string[] (CPT)", required: true },
        { name: "modifiers", type: "string[]|null", required: true },
        { name: "payer", type: "string|null", required: true },
        { name: "place_of_service", type: "enum(office|inpatient|telehealth)", required: true },
      ],
      hard: true,
      attempt1: { dx_codes: ["E11.65", "M17.11"], procedures: ["83036", "73562"], modifiers: ["LT"], payer: null, place_of_service: "office" },
      errors: [
        "modifiers: 'LT' contradicts the note (right knee), expected 'RT'",
        "procedures: '73562' is bilateral; note says right only, expected the unilateral code",
      ],
      retryNote: "Re-prompt with the note's laterality: the film is right-side. Correct the modifier to RT and the procedure to the unilateral code before the claim writes.",
      final: { dx_codes: ["E11.65", "M17.11"], procedures: ["83036", "73560"], modifiers: ["RT"], payer: null, place_of_service: "office" },
    },
  },
  {
    id: "gap04-logistics-exception",
    labId: "GAP-04",
    industry: "logistics",
    provenance: studied,
    title: "Carrier email → shipment exception",
    oneLiner: "A messy dispatch email becomes a structured exception event.",
    context:
      "A messy 'where's my truck' email from dispatch is parsed into a structured shipment-exception event that a TMS can act on, delay type, new ETA, reefer temp, and whether the dock appointment needs rescheduling.",
    theDecision:
      "Reliability lives at the systems-of-record boundary: the value is a clean, typed event the TMS can consume, not a paraphrase a human still has to re-key.",
    whatMostMiss:
      "The hard part isn't understanding the email, it's producing the exact typed event the downstream system expects, every time, so no human re-keys it.",
    stakes: "A mis-parsed exception that doesn't reach the TMS is a missed dock slot and a detention charge.",
    takeaway: "The payoff is a typed event the system of record can act on, not a summary a human re-keys.",
    sources: [
      "TMS shipment-exception event modeling",
      "Freeform-to-structured extraction at the integration boundary",
    ],
    lastVerified: "2026-07-03",
    payload: {
      label: "Carrier email → shipment exception",
      raw: "Hey, heads up, truck for PO 88214 is running behind. Driver hit weather on I-80, now ETA is tomorrow AM instead of tonight. Reefer temp is fine, holding at 34F. Might need to reschedule the dock appt., Dispatch",
      schema: [
        { name: "po_number", type: "string", required: true },
        { name: "exception_type", type: "enum(delay|damage|temp|reroute)", required: true },
        { name: "new_eta", type: "string (ISO)|null", required: true },
        { name: "reefer_temp_f", type: "number|null", required: true },
        { name: "reschedule_dock", type: "boolean", required: true },
        { name: "summary", type: "string", required: true },
      ],
      hard: false,
      final: { po_number: "PO-88214", exception_type: "delay", new_eta: "2026-07-04T09:00", reefer_temp_f: 34, reschedule_dock: true, summary: "PO-88214 delayed by weather on I-80; new ETA tomorrow AM; reefer nominal at 34F; dock appointment likely needs rescheduling." },
    },
  },
  {
    id: "gap04-realestate-lease",
    labId: "GAP-04",
    industry: "real-estate",
    provenance: studied,
    title: "Commercial lease → key terms",
    oneLiner: "The break penalty isn't in the doc, so it's nulled and flagged, not invented.",
    context:
      "A commercial lease is parsed for rent, escalations, and the break option. The break penalty references 'Exhibit D, amount to be determined'; the first pass invents a number, and the gate forces it to null-and-flag for legal review instead.",
    theDecision:
      "Null-and-flag beats hallucinate: any value not present in the document is set null and routed to legal, never guessed, because a confident wrong number is worse than an honest blank.",
    whatMostMiss:
      "Extraction demos reward filling every field. On legal docs the disciplined move is leaving a field null when the source defers it, a fabricated penalty is a liability, not a convenience.",
    stakes: "An invented lease term that reaches an abstract or a model is a legal and valuation error carried downstream.",
    takeaway: "If it isn't in the document, null it and flag it, a confident wrong number is worse than a blank.",
    sources: [
      "Commercial-lease abstraction (rent, escalations, break options)",
      "Extraction hallucination controls (null-and-flag over invent)",
    ],
    lastVerified: "2026-07-03",
    payload: {
      label: "Commercial lease → key terms",
      raw: "Base Rent shall be $42.00 per rentable square foot per annum. Tenant leases 12,400 RSF. Annual escalation of three percent (3%). Tenant shall have one option to terminate after the 60th month upon nine (9) months' prior written notice and payment of an unamortized TI penalty [amount to be determined per Exhibit D].",
      schema: [
        { name: "base_rent_psf", type: "number", required: true },
        { name: "rsf", type: "number", required: true },
        { name: "escalation_pct", type: "number", required: true },
        { name: "break_option_month", type: "number|null", required: true },
        { name: "break_notice_months", type: "number|null", required: true },
        { name: "break_penalty_usd", type: "number|null", required: true },
        { name: "annual_base_rent", type: "number", required: true },
      ],
      hard: true,
      attempt1: { base_rent_psf: 42, rsf: 12400, escalation_pct: 3, break_option_month: 60, break_notice_months: 9, break_penalty_usd: 85000, annual_base_rent: 520800 },
      errors: [
        "break_penalty_usd: value not present in source (text: 'amount to be determined per Exhibit D'), must be null + flagged, not invented",
      ],
      retryNote: "Re-prompt to null-and-flag anything not in the document: the break penalty defers to Exhibit D, set it null and route to legal review rather than inventing a figure.",
      final: { base_rent_psf: 42, rsf: 12400, escalation_pct: 3, break_option_month: 60, break_notice_months: 9, break_penalty_usd: null, annual_base_rent: 520800 },
    },
  },
]);
