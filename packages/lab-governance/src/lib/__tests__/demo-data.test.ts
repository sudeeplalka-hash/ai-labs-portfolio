import { describe, it, expect } from 'vitest';
import demo from '@gov/lib/demo-data.json';

describe('static demo snapshot', () => {
  const d = demo as Record<string, unknown>;
  it('has all required keys', () => {
    for (const k of ['metrics', 'useCases', 'policies', 'reviewQueue', 'auditEvents', 'auditVerify', 'promptEvents', 'evidence', 'evalSuites', 'evalCases']) {
      expect(d[k], `missing ${k}`).toBeDefined();
    }
  });
  it('carries the portfolio + value metrics', () => {
    const m = d.metrics as { value_metrics?: unknown };
    expect(m.value_metrics).toBeDefined();
    expect((d.useCases as unknown[]).length).toBe(5);
    expect((d.policies as unknown[]).length).toBe(11);
  });
  it('audit chain is valid and hashed', () => {
    expect((d.auditVerify as { valid: boolean }).valid).toBe(true);
    expect((d.auditEvents as { entry_hash?: string }[])[0].entry_hash).toBeTruthy();
  });
});
