import { describe, expect, it } from 'vitest';
import { assessProgramEvidence, type ProgramEvidenceInput } from '../program-evidence';
import { confidencePercent, formatReportingDate } from '../utils';
import { policyHref, evalSuiteHref } from '../navigation';

const complete: ProgramEvidenceInput = {
  initiativeName: 'Service assistant', governanceTier: 'Medium', hasDataHandoff: true, dataReadinessScore: 0,
  hasBuildContract: true, evalRunId: 'eval-1', citationAccuracy: 0, hallucinationRisk: 0,
  hasOperateEvidence: true, driftRisk: 0, monitoringCoverageScore: 0, sloStatus: 'breached', regressionStatus: 'Block release', versionLineage: { model: 'v1' },
};

describe('governance presentation boundaries', () => {
  it('does not assess an unnamed program even if other sample-like fields exist', () => {
    const result = assessProgramEvidence({ ...complete, initiativeName: ' ' });
    expect(result.loaded).toBe(false);
    expect(Object.values(result.dimensions).every(dimension => !dimension.assessed)).toBe(true);
  });
  it('keeps missing stage records pending even when default metric values are present', () => {
    const result = assessProgramEvidence({ ...complete, hasBuildContract: false, hasOperateEvidence: false });
    expect(result.dimensions.build.assessed).toBe(false);
    expect(result.dimensions.ops.assessed).toBe(false);
    expect(result.complete).toBe(false);
  });
  it('distinguishes a recorded zero or failing assessment from missing evidence', () => {
    expect(assessProgramEvidence(complete).complete).toBe(true);
    expect(assessProgramEvidence({ ...complete, citationAccuracy: undefined }).complete).toBe(false);
    expect(assessProgramEvidence({ ...complete, versionLineage: {} }).dimensions.audit.assessed).toBe(false);
  });
  it('retains route namespace, selected policy or suite, and originating case', () => {
    expect(policyHref('financial-advice-escalation', 'case 1')).toBe('/govern/policies?policy=financial-advice-escalation&case=case%201');
    expect(evalSuiteHref('financial', 'case 1')).toBe('/govern/evals?suite=financial&case=case%201');
  });
  it('converts fractional confidence to the same percent shown in audit records', () => {
    expect(confidencePercent(0.77)).toBe('77%');
    expect(confidencePercent(0)).toBe('0%');
    expect(confidencePercent(1)).toBe('100%');
  });
  it('shows the chosen reporting calendar day at both UTC boundaries', () => {
    expect(formatReportingDate('2026-01-01T00:00:00.000Z')).toBe('Jan 1, 2026');
    expect(formatReportingDate('2026-10-05T23:59:59.999Z')).toBe('Oct 5, 2026');
  });
});
