export const sanitizeNextPath = (value: string | null | undefined) => {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";

  try {
    const parsed = new URL(value, "http://localhost");
    return parsed.origin === "http://localhost"
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
};
