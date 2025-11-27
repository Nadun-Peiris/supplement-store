const normalizeBase = (value?: string | null) => {
  if (!value) return undefined;
  return value.trim().replace(/\/+$/, "");
};

const resolveBaseUrl = () =>
  normalizeBase(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : undefined)
  );

export function absoluteUrl(path: string) {
  if (!path.startsWith("/")) {
    throw new Error("absoluteUrl() expects a path starting with '/'");
  }

  const envBase = resolveBaseUrl();

  if (envBase) {
    return `${envBase}${path}`;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }

  throw new Error(
    "absoluteUrl() requires a public site URL. Set NEXT_PUBLIC_SITE_URL."
  );
}
