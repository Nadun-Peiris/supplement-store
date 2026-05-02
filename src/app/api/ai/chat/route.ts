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
  price: number;
  discountPrice?: number;
  image?: string;
  slug?: string;
  coa?: {
    verified?: boolean;
  };
  details?: {
    benefits?: string[];
    warnings?: string[];
  };
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

const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 12;
const chatRateLimits = new Map<string, { count: number; resetAt: number }>();

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

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIp(req);

    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: "Too many chat requests. Please try again shortly." },
        { status: 429 }
      );
    }

    // 🔥 Added 'history' to keep track of the survey questions
    const {
      message,
      history = [],
    }: { message?: string; history?: ChatHistoryEntry[] } = await req.json();
    
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
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
          .slice(-20)
      : [];

    await connectDB();

    // -----------------------
    // 🔐 LOAD USER PROFILE
    // -----------------------
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

    // -----------------------
    // 📦 LOAD & MINIFY PRODUCTS
    // -----------------------
    const searchTerms = message
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3)
      .slice(0, 6);

    const rawProducts = await Product.find(
      { isActive: true, stock: { $gt: 0 } },
      "name price discountPrice category image slug details.benefits details.warnings details.servingInfo.nutrients coa.verified"
    ).lean<RawProduct[]>();

    const relevantProducts = rawProducts
      .filter((product) => {
        if (searchTerms.length === 0) return true;
        const haystack = `${product.name} ${product.category}`.toLowerCase();
        return searchTerms.some((term) => haystack.includes(term));
      })
      .slice(0, 30);

    const promptProducts =
      relevantProducts.length >= 8 ? relevantProducts : rawProducts.slice(0, 30);

    const minifiedProducts = promptProducts.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      cat: p.category,
      price: p.price,
      discountPrice: p.discountPrice,
      isLabTested: p.coa?.verified || false,
      benefits: p.details?.benefits?.slice(0, 3) || [],
      warnings: p.details?.warnings || [],
    }));

    // -----------------------
    // 🤖 GEMINI MODEL SETUP
    // -----------------------
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // Format history for Gemini
    const formattedHistory = safeHistory
      .map((msg) => `${msg.role === "user" ? "USER" : "AI"}: ${msg.content}`)
      .join("\n");

    // -----------------------
    // 🧠 THE "SURVEY FIRST" PROMPT
    // -----------------------
    const prompt = `
You are an elite, certified Sri Lankan Supplement Expert. 

### THE CONSULTATION PROTOCOL (CRITICAL):
1. NO INSTANT RECOMMENDATIONS: If a user asks for a product (e.g., "I want creatine" or "Need protein"), DO NOT recommend products immediately. 
2. QUALIFY THE USER: You MUST ask 2 to 3 quick survey questions first to narrow it down. 
   - Good questions: "What is your budget in LKR?", "Do you have any allergies (like soy or dairy)?", "What is your main fitness goal?"
   - Skip questions if the user already provided the info or if it's in their User Profile.
3. RECOMMEND WHEN READY: Only when you have enough information to make a perfect match, set "intent" to "recommend" and provide up to 3 products.
4. GENERAL CHAT: If they just say "Hi" or ask a general fitness question, answer helpfully without pushing products.

### ELDER RULES (Age 50+):
- NO stimulants, pre-workouts, or harsh fat burners.
- Prioritize joint support (collagen), heart health (omega-3), and pure proteins.

### CONVERSATION HISTORY:
${formattedHistory ? formattedHistory : "No previous history. This is the start of the chat."}

### CURRENT USER MESSAGE:
"${message}"

### USER PROFILE:
${userProfile ? JSON.stringify(userProfile, null, 2) : "Guest User (No profile)."}

### STORE PRODUCTS (In-Stock):
${JSON.stringify(minifiedProducts)}

### REQUIRED JSON OUTPUT SCHEMA:
{
  "intent": "chat" | "survey" | "recommend",
  "reply": "Your conversational response. If 'survey', ask the questions here. If 'recommend', explain why you chose these items.",
  "products": [
    {
      "id": "Exact product id from the list",
      "reason": "1 sentence explaining why it fits their specific survey answers.",
      "score": 9
    }
  ]
}
`;

    // -----------------------
    // 🤖 GET AI RESPONSE
    // -----------------------
    const result = await model.generateContent(prompt);
    
    let parsed: ParsedAIResponse;
    try {
      parsed = JSON.parse(result.response.text()) as ParsedAIResponse;
    } catch {
      console.error("❌ AI returned invalid JSON:", result.response.text());
      parsed = {
        intent: "chat",
        reply: "I'm having a little trouble thinking right now. Could you repeat that?",
        products: [],
      };
    }

    // -----------------------
    // 🧩 ENRICH PRODUCT DATA (ONLY IF INTENT IS 'recommend')
    // -----------------------
    let enrichedProducts: EnrichedAIProduct[] = [];
    
    if (parsed.intent === "recommend" && Array.isArray(parsed.products)) {
      const index = new Map(rawProducts.map((p) => [p._id.toString(), p]));

      enrichedProducts = parsed.products
        .map<EnrichedAIProduct | null>((p) => {
          const match = index.get(p.id);
          if (!match) return null;

          return {
            id: match._id.toString(),
            name: match.name,
            price: match.price,
            discountPrice: match.discountPrice,
            image: match.image,
            slug: match.slug,
            reason: p.reason || "",
            score: p.score || 0,
          };
        })
        .filter(
          (product): product is EnrichedAIProduct => product !== null
        );
    }

    // -----------------------
    // SEND TO FRONTEND
    // -----------------------
    return NextResponse.json({
      intent: parsed.intent || "chat",
      reply: parsed.reply || "How can I help you today?",
      products: enrichedProducts,
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
