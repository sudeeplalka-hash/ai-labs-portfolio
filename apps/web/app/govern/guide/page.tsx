import type { Metadata } from "next";
import { ShieldCheck, FolderOpen, FileCode2, ShieldHalf, Swords, Users, ClipboardCheck } from "lucide-react";
import { LabGuide } from "@/components/shell/LabGuide";

export const metadata: Metadata = { title: "Guide · Govern" };

export default function Page() {
  return (
    <LabGuide
      stage="How this lab works"
      title="Govern, in plain terms"
      icon={ShieldCheck}
      intro="This is what makes the system safe enough to put in front of customers and regulators. You tier each use case by risk, enforce policy at runtime, catch problems with guardrails and red teaming, and produce the evidence an auditor will actually accept."
      steps={[
        { icon: FolderOpen, title: "Register and risk tier", body: "Each use case is scored from its data sensitivity, deployment context, autonomy, business function, and human oversight.", why: "Not all AI is equally risky, controls should match the tier, not be one size fits all." },
        { icon: FileCode2, title: "Policy as code", body: "Turn on rules, PII redaction, protected class checks, and more, that are enforced automatically on every request.", why: "A policy that isn't enforced at runtime is just a document nobody reads." },
        { icon: ShieldHalf, title: "Runtime guardrails", body: "Every request is allowed, redacted, rewritten, blocked, or escalated based on the active policies.", why: "This is where harm is caught and contained before it ever reaches a user." },
        { icon: Swords, title: "Red team and evals", body: "Probe the system with adversarial prompts and evaluation suites to find where it fails.", why: "Better to find the failure yourself than to let an attacker, or a headline, find it first." },
        { icon: Users, title: "Human review and audit", body: "Risky requests queue to a person, and every decision is logged in a tamper evident trail.", why: "Accountability needs a paper trail, and someone who owns the call." },
        { icon: ClipboardCheck, title: "Evidence and readiness", body: "Generate a report mapped to frameworks like NIST AI RMF, the EU AI Act, and ISO 42001.", why: "'Trust us' doesn't pass an audit. Evidence, mapped to a standard, does." },
      ]}
      closing="Govern is what lets you ship AI to customers and regulators with confidence, not crossed fingers."
      closingIcon={ShieldCheck}
    />
  );
}
