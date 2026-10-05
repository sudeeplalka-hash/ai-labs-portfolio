/** Query-selected detail also works for browser-created IDs in a static export. */
export const caseHref = (id: string) => `/govern/use-cases?case=${encodeURIComponent(id)}`;
export const caseContextHref = (path: string, id: string, eventId?: string) => `${path}?case=${encodeURIComponent(id)}${eventId ? `&event=${encodeURIComponent(eventId)}` : ''}`;

const governanceSelectionHref = (path: 'policies' | 'evals', key: 'policy' | 'suite', value: string, caseId?: string) =>
  `/govern/${path}?${key}=${encodeURIComponent(value)}${caseId ? `&case=${encodeURIComponent(caseId)}` : ''}`;
export const policyHref = (slug: string, caseId?: string) => governanceSelectionHref('policies', 'policy', slug, caseId);
export const evalSuiteHref = (suite: string, caseId?: string) => governanceSelectionHref('evals', 'suite', suite, caseId);
