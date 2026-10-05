/** Presentation coverage only: never substitute optimistic engine defaults for missing records. */
export interface ProgramEvidenceInput {
  initiativeName?: string | null;
  governanceTier?: string;
  hasDataHandoff: boolean;
  dataReadinessScore?: number;
  hasBuildContract: boolean;
  evalRunId?: string;
  citationAccuracy?: number;
  hallucinationRisk?: number;
  hasOperateEvidence: boolean;
  driftRisk?: number;
  monitoringCoverageScore?: number;
  sloStatus?: string;
  regressionStatus?: string;
  versionLineage?: object;
}

export function assessProgramEvidence(input: ProgramEvidenceInput) {
  const loaded = Boolean(input.initiativeName?.trim());
  const numeric = (value?: number) => typeof value === 'number' && Number.isFinite(value);
  const dimensions = {
    usecase: { assessed: loaded && Boolean(input.governanceTier), source: 'Strategy metadata', missing: 'Record the initiative and its governance tier in Frame.', href: '/frame' },
    data: { assessed: loaded && input.hasDataHandoff && numeric(input.dataReadinessScore), source: 'Data handoff', missing: 'Create a Data handoff with a readiness assessment.', href: '/data' },
    build: { assessed: loaded && input.hasBuildContract && Boolean(input.evalRunId) && numeric(input.citationAccuracy) && numeric(input.hallucinationRisk), source: 'Build contract', missing: 'Record a Build evaluation, including citation accuracy and hallucination risk.', href: '/build' },
    ops: { assessed: loaded && input.hasOperateEvidence && numeric(input.driftRisk) && numeric(input.monitoringCoverageScore) && Boolean(input.sloStatus) && Boolean(input.regressionStatus), source: 'Operate evidence', missing: 'Record an Operate assessment with SLO, drift, monitoring and regression results.', href: '/operate' },
    audit: { assessed: loaded && Boolean(input.evalRunId) && Boolean(input.versionLineage && Object.values(input.versionLineage).length > 0 && Object.values(input.versionLineage).every(Boolean)), source: 'Recorded evaluation and version lineage', missing: 'Link the evaluation run and version lineage in Build and Operate.', href: '/operate' },
  };
  return { loaded, dimensions, complete: Object.values(dimensions).every(dimension => dimension.assessed) };
}
