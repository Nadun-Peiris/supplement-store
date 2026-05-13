import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminAuth } from "@/lib/firebaseAdmin";
import "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Product from "@/models/Product";

type ChatHistoryEntry = {
  role: "user" | "ai";
  content: string;
};

type RawProduct = {
  _id: { toString(): string };
  name: string;
  category: string;
  categorySlug?: string;
  brandName?: string;
  price: number;
  discountPrice?: number;
  image?: string;
  slug?: string;
  description?: string;
  coa?: {
    verified?: boolean;
  };
  details?: {
    overview?: string;
    ingredients?: string[];
    benefits?: string[];
    warnings?: string[];
    servingInfo?: {
      ingredientsText?: string;
      containsText?: string;
      noticeText?: string;
    };
  };
  stock?: number;
};

type ParsedAIProduct = {
  id: string;
  reason?: string;
  score?: number;
};

type ParsedAIResponse = {
  intent?: "chat" | "survey" | "recommend";
  reply?: string;
  products?: ParsedAIProduct[];
};

type EnrichedAIProduct = {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  image?: string;
  slug?: string;
  reason: string;
  score: number;
  brandName?: string;
  category?: string;
  isLabTested: boolean;
};

type AIUserProfile = {
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  goal?: string;
  activity?: string;
  diet?: string;
  conditions?: string;
};

type RankedProduct = {
  product: RawProduct;
  score: number;
};

const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 12;
const chatRateLimits = new Map<string, { count: number; resetAt: number }>();

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "any",
  "are",
  "but",
  "can",
  "for",
  "from",
  "get",
  "give",
  "have",
  "help",
  "how",
  "i",
  "im",
  "into",
  "just",
  "like",
  "me",
  "need",
  "please",
  "recommend",
  "some",
  "that",
  "the",
  "them",
  "want",
  "with",
  "would",
  "you",
  "your",
]);

const ALLERGY_TERMS = [
  "dairy",
  "lactose",
  "milk",
  "soy",
  "gluten",
  "caffeine",
  "gelatin",
];

const GOAL_SIGNAL_GROUPS = [
  {
    label: "muscle gain",
    terms: [
      "bulk",
      "bulking",
      "gain",
      "gainer",
      "hypertrophy",
      "mass",
      "muscle",
      "size",
      "strength",
      "whey",
    ],
  },
  {
    label: "fat loss",
    terms: [
      "cut",
      "cutting",
      "fat",
      "lean",
      "slim",
      "thermogenic",
      "weight",
      "loss",
    ],
  },
  {
    label: "recovery",
    terms: [
      "amino",
      "electrolyte",
      "recovery",
      "hydrate",
      "rehydrate",
      "sleep",
      "soreness",
    ],
  },
  {
    label: "energy",
    terms: ["energy", "focus", "performance", "preworkout", "pump", "stamina"],
  },
  {
    label: "general wellness",
    terms: [
      "beauty",
      "health",
      "immunity",
      "joint",
      "omega",
      "vitamin",
      "wellness",
    ],
  },
];

const normalizeText = (value: string) => value.toLowerCase();

const tokenize = (value: string) =>
  normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));

const unique = (items: string[]) => Array.from(new Set(items));

const getClientIp = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip") ||
  "unknown";

const isRateLimited = (clientId: string) => {
  const now = Date.now();
  const current = chatRateLimits.get(clientId);

  if (!current || current.resetAt <= now) {
    chatRateLimits.set(clientId, {
      count: 1,
      resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  current.count += 1;
  return current.count > CHAT_RATE_LIMIT_MAX_REQUESTS;
};

const getEffectivePrice = (product: RawProduct) =>
  typeof product.discountPrice === "number" &&
  product.discountPrice < product.price
    ? product.discountPrice
    : product.price;

const parseBudgetLkr = (value: string) => {
  const budgetMatch = value.match(
    /(?:lkr|rs\.?|rupees?|රු)\s*([0-9][0-9,]{2,})|([0-9][0-9,]{2,})\s*(?:lkr|rs\.?|rupees?|රු)/i
  );
  const numeric = budgetMatch?.[1] || budgetMatch?.[2];
  if (!numeric) return null;

  const parsed = Number(numeric.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const getProfileTerms = (profile: AIUserProfile | null) =>
  unique(
    [
      profile?.goal,
      profile?.activity,
      profile?.diet,
      profile?.conditions,
      profile?.gender,
    ]
      .filter(Boolean)
      .flatMap((value) => tokenize(value as string))
  );

const getGoalSignals = (value: string) => {
  const tokens = new Set(tokenize(value));

  return GOAL_SIGNAL_GROUPS.filter((group) =>
    group.terms.some((term) => tokens.has(term))
  ).map((group) => group.label);
};

const countTokenMatches = (value: string, tokens: string[]) => {
  if (!value || tokens.length === 0) return 0;

  const source = normalizeText(value);
  return tokens.reduce(
    (count, token) => count + (source.includes(token) ? 1 : 0),
    0
  );
};

const buildProductText = (product: RawProduct) =>
  [
    product.name,
    product.brandName,
    product.category,
    product.categorySlug,
    product.description,
    product.details?.overview,
    ...(product.details?.ingredients || []),
    ...(product.details?.benefits || []),
    ...(product.details?.warnings || []),
    product.details?.servingInfo?.ingredientsText,
    product.details?.servingInfo?.containsText,
    product.details?.servingInfo?.noticeText,
  ]
    .filter(Boolean)
    .join(" ");

const rankProducts = ({
  products,
  searchTokens,
  profileTerms,
  contextText,
  userProfile,
}: {
  products: RawProduct[];
  searchTokens: string[];
  profileTerms: string[];
  contextText: string;
  userProfile: AIUserProfile | null;
}) => {
  const allergySignals = ALLERGY_TERMS.filter((term) =>
    normalizeText(contextText).includes(term)
  );
  const budgetLkr = parseBudgetLkr(contextText);
  const seniorGuardrail = (userProfile?.age || 0) >= 50;
  const signalLabels = getGoalSignals(contextText);

  const ranked: RankedProduct[] = products.map((product) => {
    const productText = buildProductText(product);
    const nameAndBrand = `${product.name} ${product.brandName || ""}`;
    const categoryText = `${product.category} ${product.categorySlug || ""}`;
    const benefitText = [
      product.description,
      product.details?.overview,
      ...(product.details?.benefits || []),
      ...(product.details?.ingredients || []),
    ]
      .filter(Boolean)
      .join(" ");

    let score = 0;

    score += countTokenMatches(nameAndBrand, searchTokens) * 18;
    score += countTokenMatches(categoryText, searchTokens) * 10;
    score += countTokenMatches(benefitText, searchTokens) * 7;
    score += countTokenMatches(productText, profileTerms) * 4;

    for (const label of signalLabels) {
      if (normalizeText(productText).includes(label.split(" ")[0])) {
        score += 8;
      }
    }

    if (product.coa?.verified) score += 2;

    if (budgetLkr) {
      const effectivePrice = getEffectivePrice(product);
      if (effectivePrice <= budgetLkr) {
        score += 5;
      } else if (effectivePrice <= budgetLkr * 1.15) {
        score += 2;
      } else if (effectivePrice > budgetLkr * 1.5) {
        score -= 6;
      }
    }

    if (
      seniorGuardrail &&
      /(pre[- ]?workout|fat burner|thermogenic|energy)/i.test(product.category)
    ) {
      score -= 35;
    }

    for (const allergyTerm of allergySignals) {
      if (normalizeText(productText).includes(allergyTerm)) {
        score -= 12;
      }
    }

    return { product, score };
  });

  return ranked.sort((a, b) => b.score - a.score);
};

const extractJsonObject = (value: string) => {
  const withoutFences = value
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    return withoutFences;
  }

  return withoutFences.slice(start, end + 1);
};

const parseModelResponse = (value: string): ParsedAIResponse | null => {
  try {
    return JSON.parse(extractJsonObject(value)) as ParsedAIResponse;
  } catch {
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIp(req);

    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: "Too many chat requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const {
      message,
      history = [],
    }: { message?: string; history?: ChatHistoryEntry[] } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Message is too long" },
        { status: 400 }
      );
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (entry) =>
              (entry.role === "user" || entry.role === "ai") &&
              typeof entry.content === "string"
          )
          .slice(-16)
      : [];

    await connectDB();

    let userProfile: AIUserProfile | null = null;
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = await adminAuth().verifyIdToken(token);
        const user = await User.findOne({ firebaseId: decoded.uid })
          .select("age gender height weight bmi goal activity diet conditions")
          .lean<AIUserProfile | null>();

        userProfile = user
          ? {
              age: user.age,
              gender: user.gender,
              height: user.height,
              weight: user.weight,
              bmi: user.bmi,
              goal: user.goal,
              activity: user.activity,
              diet: user.diet,
              conditions: user.conditions,
            }
          : null;
      } catch {
        userProfile = null;
      }
    }

    const rawProducts = await Product.find(
      { isActive: true, stock: { $gt: 0 } },
      [
        "name",
        "category",
        "categorySlug",
        "brandName",
        "price",
        "discountPrice",
        "image",
        "slug",
        "description",
        "details.overview",
        "details.ingredients",
        "details.benefits",
        "details.warnings",
        "details.servingInfo.ingredientsText",
        "details.servingInfo.containsText",
        "details.servingInfo.noticeText",
        "coa.verified",
        "stock",
      ].join(" ")
    ).lean<RawProduct[]>();

    const recentUserMessages = safeHistory
      .filter((entry) => entry.role === "user")
      .slice(-3)
      .map((entry) => entry.content);
    const searchSource = [message, ...recentUserMessages].join(" ");
    const searchTokens = unique(tokenize(searchSource)).slice(0, 24);
    const profileTerms = getProfileTerms(userProfile);
    const rankedProducts = rankProducts({
      products: rawProducts,
      searchTokens,
      profileTerms,
      contextText: searchSource,
      userProfile,
    });

    const promptProducts = (
      rankedProducts.some((entry) => entry.score > 0)
        ? rankedProducts.filter((entry) => entry.score > 0)
        : rankedProducts
    )
      .slice(0, 18)
      .map(({ product, score }) => ({
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName || "",
        category: product.category,
        price: product.price,
        discountPrice: product.discountPrice,
        effectivePrice: getEffectivePrice(product),
        isLabTested: product.coa?.verified || false,
        overview: product.details?.overview || product.description || "",
        benefits: product.details?.benefits?.slice(0, 4) || [],
        warnings: product.details?.warnings?.slice(0, 4) || [],
        contains: product.details?.servingInfo?.containsText || "",
        matchScore: Math.max(0, Math.min(100, Math.round(score))),
      }));

    const formattedHistory = safeHistory
      .map(
        (msg, index) =>
          `${index + 1}. ${msg.role === "user" ? "USER" : "AI"}: ${msg.content}`
      )
      .join("\n");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY missing" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.25,
        topP: 0.9,
      },
    });

    const prompt = `
You are Supplement Coach for Supplement Lanka, a Sri Lankan supplement store.

Core behavior:
- Stay grounded in the provided catalog only. Never invent products, ingredients, prices, stock, lab testing, warnings, or benefits.
- If the user wants a recommendation but key constraints are still missing, ask 2 to 3 short high-signal survey questions first and set "intent" to "survey".
- Survey questions must be very short and easy to answer.
- Prefer yes/no questions and number-only questions.
- For budget, ask for a number in LKR only.
- For age-sensitive or stimulant-sensitive cases, ask direct yes/no questions such as "Are you over 50?" or "Do you want a low-stimulant option?"
- Only use a tiny choice list if yes/no or numeric answers are not enough. Keep choices short.
- Put each survey question on its own line using 1., 2., 3.
- Key recommendation constraints are: goal, experience level, budget in LKR, dietary or allergy restrictions, stimulant tolerance when relevant, and any medical/safety concerns already mentioned.
- Only set "intent" to "recommend" when you have enough information to make a defensible recommendation.
- Recommend at most 3 products. Use exact product ids from the catalog.
- If the user asks a general fitness or supplement question, answer helpfully with "intent": "chat" and do not force products.

Safety rules:
- Do not diagnose, prescribe, or claim a supplement treats disease.
- If the user mentions medications, pregnancy, severe symptoms, chronic disease, or being under 18, include a brief safety caution and keep recommendations conservative.
- If user age is 50 or above, avoid stimulants, fat burners, and harsh pre-workouts unless the user specifically insists and there is strong justification. Prefer conservative products such as protein, collagen, omega-3, or basic wellness support where relevant.

Recommendation quality rules:
- Prefer the best-fit catalog items, not generic variety.
- Respect budget when provided.
- Mention the user's actual context in each product reason.
- If none of the provided products fit well, say that clearly and ask a follow-up instead of forcing a weak recommendation.
- Keep survey replies compact. Do not write long paragraphs before the questions.

Conversation history:
${formattedHistory || "No previous history."}

Current user message:
"${message}"

User profile:
${userProfile ? JSON.stringify(userProfile, null, 2) : "Guest user"}

Ranked in-stock catalog candidates:
${JSON.stringify(promptProducts, null, 2)}

Respond with raw JSON only using this schema:
{
  "intent": "chat" | "survey" | "recommend",
  "reply": "Short helpful response for the user",
  "products": [
    {
      "id": "exact catalog id",
      "reason": "one sentence tied to the user's needs",
      "score": 1-10
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const parsed = parseModelResponse(rawText) || {
      intent: "chat" as const,
      reply:
        "I had trouble structuring that answer. Ask again and I’ll keep it tighter.",
      products: [],
    };

    const productIndex = new Map(rawProducts.map((p) => [p._id.toString(), p]));
    const dedupedProductIds = new Set<string>();

    let enrichedProducts: EnrichedAIProduct[] = [];

    if (parsed.intent === "recommend" && Array.isArray(parsed.products)) {
      enrichedProducts = parsed.products
        .map<EnrichedAIProduct | null>((item) => {
          if (!item?.id || dedupedProductIds.has(item.id)) return null;

          const match = productIndex.get(item.id);
          if (!match) return null;

          dedupedProductIds.add(item.id);

          return {
            id: match._id.toString(),
            name: match.name,
            price: match.price,
            discountPrice: match.discountPrice,
            image: match.image,
            slug: match.slug,
            reason: item.reason || "",
            score:
              typeof item.score === "number"
                ? Math.max(1, Math.min(10, Math.round(item.score)))
                : 0,
            brandName: match.brandName,
            category: match.category,
            isLabTested: match.coa?.verified || false,
          };
        })
        .filter(
          (product): product is EnrichedAIProduct => product !== null
        )
        .slice(0, 3);
    }

    const finalIntent =
      parsed.intent === "recommend" && enrichedProducts.length === 0
        ? "survey"
        : parsed.intent || "chat";

    const finalReply =
      parsed.reply?.trim() ||
      (finalIntent === "survey"
        ? "Tell me a bit more about your goal, budget, and any restrictions so I can narrow this down."
        : "How can I help you today?");

    return NextResponse.json({
      intent: finalIntent,
      reply: finalReply,
      products: finalIntent === "recommend" ? enrichedProducts : [],
    });
  } catch (err) {
    console.error("AI Chat Error:", err);
    return NextResponse.json(
      {
        intent: "chat",
        reply: "The AI is busy at the moment. Please try again shortly.",
        products: [],
      },
      { status: 500 }
    );
  }
}
