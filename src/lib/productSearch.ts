type SearchableProduct = {
  name?: string;
  category?: string;
  brandName?: string;
  description?: string;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const levenshteinDistance = (left: string, right: string) => {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const rows = Array.from({ length: left.length + 1 }, () =>
    new Array<number>(right.length + 1).fill(0)
  );

  for (let i = 0; i <= left.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) rows[0][j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost
      );
    }
  }

  return rows[left.length][right.length];
};

const similarity = (left: string, right: string) => {
  const longest = Math.max(left.length, right.length);
  if (!longest) return 1;
  return 1 - levenshteinDistance(left, right) / longest;
};

const scoreField = (queryToken: string, field: string) => {
  if (!queryToken || !field) return 0;
  if (field === queryToken) return 1;
  if (field.startsWith(queryToken)) return 0.92;
  if (field.includes(queryToken)) return 0.82;

  const tokens = field.split(" ").filter(Boolean);
  let best = similarity(queryToken, field);

  for (const token of tokens) {
    best = Math.max(best, similarity(queryToken, token));
    if (token.startsWith(queryToken)) best = Math.max(best, 0.9);
    if (queryToken.startsWith(token) && token.length >= 3) {
      best = Math.max(best, 0.76);
    }
  }

  return best;
};

export const normalizeSearchTerm = (value: string | null | undefined) =>
  normalizeText(value ?? "");

export const getProductSearchScore = (
  product: SearchableProduct,
  rawQuery: string
) => {
  const query = normalizeSearchTerm(rawQuery);
  if (!query) return 0;

  const fields = [
    normalizeText(product.name ?? ""),
    normalizeText(product.category ?? ""),
    normalizeText(product.brandName ?? ""),
    normalizeText(product.description ?? ""),
  ].filter(Boolean);

  if (!fields.length) return 0;

  const queryTokens = query.split(" ").filter(Boolean);
  const fieldWeights = [1.2, 1, 0.8, 0.55];

  let totalScore = 0;

  for (const token of queryTokens) {
    let tokenBest = 0;

    fields.forEach((field, index) => {
      tokenBest = Math.max(tokenBest, scoreField(token, field) * (fieldWeights[index] ?? 0.5));
    });

    totalScore += tokenBest;
  }

  const averageScore = totalScore / queryTokens.length;
  const directFieldMatch = fields.some(
    (field) =>
      field.includes(query) ||
      similarity(query, field) >= 0.7 ||
      field.split(" ").some((token) => similarity(query, token) >= 0.72)
  );

  if (!directFieldMatch && averageScore < 0.72) {
    return 0;
  }

  return averageScore;
};
