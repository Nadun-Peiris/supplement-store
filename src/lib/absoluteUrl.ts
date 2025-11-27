export function absoluteUrl(path: string) {
  if (!path.startsWith("/")) {
    throw new Error("absoluteUrl() expects a path starting with '/'");
  }

  const vercel = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;

  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    vercel ||
    "http://localhost:3000";

  return site + path;
}
