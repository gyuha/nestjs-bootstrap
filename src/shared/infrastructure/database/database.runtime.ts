export const sqlitePathFromUrl = (url: string): string =>
  url.startsWith('file:') ? url.slice('file:'.length) : url;

export const isBunRuntime = (): boolean =>
  'Bun' in globalThis || 'bun' in process.versions;
