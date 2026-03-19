import type { ProductNutrientDTO, ProductServingInfoDTO } from "@/types/product";

const DEFAULT_NUTRITION_TITLE = "Nutrition Facts";
const DEFAULT_AMOUNT_PER_SERVING_LABEL = "Amount Per Serving";
const DEFAULT_DAILY_VALUE_LABEL = "% Daily Value";

const normalizeText = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim();
};

const parseServingsPerContainer = (value: string) => {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseIndentLevel = (line: string) => {
  const whitespace = line.match(/^\s*/)?.[0].length ?? 0;
  return whitespace >= 4 ? 1 : 0;
};

const parseNutrientLine = (line: string): ProductNutrientDTO | null => {
  const original = line;
  let working = line.trim();

  if (!working) return null;

  let dailyValue: string | undefined;
  const dvMatch = working.match(/(?:\s{2,}|\t+)(<?\d+(?:\.\d+)?%)$/);
  if (dvMatch) {
    dailyValue = dvMatch[1].trim();
    working = working.slice(0, dvMatch.index).trimEnd();
  }

  const columns = working.split(/\s{2,}|\t+/).filter(Boolean);
  let name = "";
  let amount = "";

  if (columns.length >= 2) {
    amount = columns.pop() ?? "";
    name = columns.join(" ").trim();
  } else {
    const includesMatch = working.match(
      /^(Includes)\s+(<?\d+(?:\.\d+)?\s*(?:g|mg|mcg|kcal|cal|iu)?)\s+(.+)$/i
    );

    if (includesMatch) {
      name = `${includesMatch[1]} ${includesMatch[3]}`.trim();
      amount = includesMatch[2].trim();
    } else {
      const trailingAmountMatch = working.match(
        /^(.*?)(<?\d+(?:\.\d+)?\s*(?:g|mg|mcg|kcal|cal|iu)?)$/i
      );

      if (trailingAmountMatch) {
        name = trailingAmountMatch[1].trim();
        amount = trailingAmountMatch[2].trim();
      } else {
        name = working;
      }
    }
  }

  if (!name) return null;

  const indentLevel = parseIndentLevel(original);
  const emphasized =
    indentLevel === 0 &&
    !/^includes\s/i.test(name) &&
    !/^trans fat$/i.test(name) &&
    !/^saturated fat$/i.test(name);

  return {
    name,
    amount: amount || undefined,
    dailyValue,
    indentLevel,
    emphasized,
  };
};

export const parseNutritionFactsText = (input: string): ProductServingInfoDTO => {
  const text = normalizeText(input);

  if (!text) {
    return {
      title: DEFAULT_NUTRITION_TITLE,
      amountPerServingLabel: DEFAULT_AMOUNT_PER_SERVING_LABEL,
      dailyValueLabel: DEFAULT_DAILY_VALUE_LABEL,
      nutrients: [],
    };
  }

  const lines = text
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .filter((line) => line.trim().length);

  const servingInfo: ProductServingInfoDTO = {
    title: DEFAULT_NUTRITION_TITLE,
    amountPerServingLabel: DEFAULT_AMOUNT_PER_SERVING_LABEL,
    dailyValueLabel: DEFAULT_DAILY_VALUE_LABEL,
    nutrients: [],
  };

  const nutrientLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (!servingInfo.title && !trimmed.includes(":")) {
      servingInfo.title = trimmed;
      continue;
    }

    if (/facts$/i.test(trimmed) && servingInfo.title === DEFAULT_NUTRITION_TITLE) {
      servingInfo.title = trimmed;
      continue;
    }

    if (/^serving size\s*:/i.test(trimmed)) {
      servingInfo.servingSize = trimmed.replace(/^serving size\s*:/i, "").trim();
      continue;
    }

    if (/^servings per container\s*:/i.test(trimmed)) {
      servingInfo.servingsPerContainer = parseServingsPerContainer(
        trimmed.replace(/^servings per container\s*:/i, "").trim()
      );
      continue;
    }

    if (/amount per serving/i.test(trimmed) && /daily value/i.test(trimmed)) {
      const parts = trimmed.split(/\s{2,}|\t+/).filter(Boolean);
      servingInfo.amountPerServingLabel =
        parts[0]?.trim() || DEFAULT_AMOUNT_PER_SERVING_LABEL;
      servingInfo.dailyValueLabel =
        parts[1]?.trim() || DEFAULT_DAILY_VALUE_LABEL;
      continue;
    }

    if (/^ingredients\s*:/i.test(trimmed)) {
      servingInfo.ingredientsText = trimmed.replace(/^ingredients\s*:/i, "").trim();
      continue;
    }

    if (/^contains\s*:/i.test(trimmed)) {
      servingInfo.containsText = trimmed.replace(/^contains\s*:/i, "").trim();
      continue;
    }

    if (/^notice\s*:/i.test(trimmed)) {
      servingInfo.noticeText = trimmed.replace(/^notice\s*:/i, "").trim();
      continue;
    }

    if (
      /^the\s+%?\s*daily value/i.test(trimmed) ||
      /^percent daily value/i.test(trimmed)
    ) {
      servingInfo.footnote = trimmed;
      continue;
    }

    nutrientLines.push(line);
  }

  servingInfo.nutrients = nutrientLines
    .map(parseNutrientLine)
    .filter((row): row is ProductNutrientDTO => Boolean(row));

  return servingInfo;
};

export const defaultNutritionFacts = (): ProductServingInfoDTO => ({
  title: DEFAULT_NUTRITION_TITLE,
  amountPerServingLabel: DEFAULT_AMOUNT_PER_SERVING_LABEL,
  dailyValueLabel: DEFAULT_DAILY_VALUE_LABEL,
  nutrients: [],
});

export const nutritionFactsDefaults = {
  DEFAULT_NUTRITION_TITLE,
  DEFAULT_AMOUNT_PER_SERVING_LABEL,
  DEFAULT_DAILY_VALUE_LABEL,
};
