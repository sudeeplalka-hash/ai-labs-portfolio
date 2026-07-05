// MCP manifest diff — what changed between two servers' capability surfaces. Pure:
// compares tool / resource / prompt names and reports added / removed / kept per
// category, plus a `changed` flag. Drives the Playground's "on system switch" diff.

export interface NameDiff {
  added: string[];
  removed: string[];
  kept: string[];
}

export function diffNames(from: string[], to: string[]): NameDiff {
  const fromSet = new Set(from);
  const toSet = new Set(to);
  return {
    added: to.filter((n) => !fromSet.has(n)),
    removed: from.filter((n) => !toSet.has(n)),
    kept: to.filter((n) => fromSet.has(n)),
  };
}

export interface ManifestShape {
  tools: { name: string }[];
  resources: { name: string }[];
  prompts: { name: string }[];
}

export interface ManifestDiff {
  tools: NameDiff;
  resources: NameDiff;
  prompts: NameDiff;
  /** true when any tool / resource / prompt was added or removed. */
  changed: boolean;
}

export function diffManifests(from: ManifestShape, to: ManifestShape): ManifestDiff {
  const tools = diffNames(from.tools.map((t) => t.name), to.tools.map((t) => t.name));
  const resources = diffNames(from.resources.map((r) => r.name), to.resources.map((r) => r.name));
  const prompts = diffNames(from.prompts.map((p) => p.name), to.prompts.map((p) => p.name));
  const changed =
    tools.added.length + tools.removed.length +
    resources.added.length + resources.removed.length +
    prompts.added.length + prompts.removed.length > 0;
  return { tools, resources, prompts, changed };
}
