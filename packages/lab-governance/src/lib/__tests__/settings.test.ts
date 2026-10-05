import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('model settings snapshots', () => {
  beforeEach(() => {
    vi.resetModules();
    const values = new Map<string, string>();
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('keeps snapshot identity stable until a stored setting actually changes', async () => {
    const { getSettings, setSettings } = await import('../settings');
    const before = getSettings();
    expect(getSettings()).toBe(before);
    expect(setSettings({ model: 'test-model' })).toBe(true);
    const after = getSettings();
    expect(after).not.toBe(before);
    expect(after.model).toBe('test-model');
    expect(getSettings()).toBe(after);
  });
  it('reports a rejected storage write and retains the last readable snapshot', async () => {
    const { getSettings, setSettings } = await import('../settings');
    const before = getSettings();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('Storage disabled'); } });
    expect(setSettings({ model: 'not-saved' })).toBe(false);
    expect(getSettings()).toBe(before);
  });
});
