function ensureBase(base: string | undefined): string {
  const trimmed = (base ?? "").trim();
  if (!trimmed) {
    throw new Error("NEXT_PUBLIC_BASE_API is not configured");
  }
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path.slice(1) : path;
}

export function buildApiUrl(path: string, base?: string): URL {
  const resolvedBase = ensureBase(base ?? process.env.NEXT_PUBLIC_BASE_API);
  const relativePath = normalizePath(path);
  return new URL(relativePath, resolvedBase);
}

export function buildApiUrlString(path: string, base?: string): string {
  return buildApiUrl(path, base).toString();
}
