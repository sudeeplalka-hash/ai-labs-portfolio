import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
let api: typeof import('../api').api;

describe('sample governance workflow contracts', () => {
  beforeAll(async () => { vi.stubEnv('NEXT_PUBLIC_STATIC_DEMO', '1'); api = (await import('../api')).api; });
  afterAll(() => vi.unstubAllEnvs());
  it('returns the confirmed policy value, including when the prior list shared mutable records', async () => {
    const policies = await api.policies.list();
    const initial = policies[0].enabled;
    const result = await api.policies.toggle(policies[0].id);
    expect(result.enabled).toBe(!initial);
    expect((await api.policies.get(result.id)).enabled).toBe(result.enabled);
    expect((await api.policies.toggle(result.id)).enabled).toBe(initial);
  });
  it('honors the requested evidence dates, filters records, and does not invent evaluation runs', async () => {
    const start = '1900-01-01T00:00:00.000Z';
    const end = '1900-01-31T23:59:59.999Z';
    const report = await api.evidence.create({ title: 'Empty historical window', period_start: start, period_end: end });
    expect(report.period_start).toBe(start);
    expect(report.period_end).toBe(end);
    expect(report.prompt_event_count).toBe(0);
    expect(report.review_item_count).toBe(0);
    expect(report.eval_run_count).toBe(0);
    expect(report.completeness_score).toBeLessThan(100);
    expect(report.content_markdown).toContain('Missing: this client does not retain evaluation run history');
  });
  it('carries a newly registered case into report source IDs and actual report content', async () => {
    const created = await api.useCases.create({ name: 'Snapshot regression case', owner: 'Test owner' });
    const report = await api.evidence.create({ period_start: '2000-01-01T00:00:00Z', period_end: '2100-01-01T00:00:00Z' });
    expect(report.source_case_ids).toContain(created.id);
    expect(report.content_markdown).toContain(created.name);
    expect(report.content_markdown).toContain(created.id);
    expect(report.use_case_count).toBe((await api.useCases.list()).length);
  });
  it('links a runtime result to an inspectable session event without claiming hash verification', async () => {
    const cases = await api.useCases.list();
    const result = await api.playground.run({ use_case_id: cases[0].id, prompt: 'Hello, summarize a routine workflow.' });
    const events = await api.audit.promptEvents({ use_case_id: cases[0].id });
    const event = events.find(record => record.id === result.prompt_event_id);
    expect(event?.use_case_id).toBe(cases[0].id);
    expect(event?.audit_status).toContain('outside embedded hash chain');
  });
  it('rejects an inverted reporting window', () => {
    expect(() => api.evidence.create({ period_start: '2030-01-01', period_end: '2020-01-01' })).toThrow('valid reporting period');
  });
});
