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

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // 🔥 Added 'history' to keep track of the survey questions
    const {
      message,
      history = [],
    }: { message?: string; history?: ChatHistoryEntry[] } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // -----------------------
    // 🔐 LOAD USER PROFILE
    // -----------------------
    let userProfile: Record<string, unknown> | null = null;
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = await adminAuth().verifyIdToken(token);
        const user = await User.findOne({ firebaseId: decoded.uid }).lean();
        userProfile = user || null;
      } catch {
        console.log("AI: User not logged in.");
      }
    }

    // -----------------------
    // 📦 LOAD & MINIFY PRODUCTS
    // -----------------------
    const rawProducts = await Product.find(
      { isActive: true, stock: { $gt: 0 } },
      "name price discountPrice category image slug details.benefits details.warnings details.servingInfo.nutrients coa.verified"
    ).lean<RawProduct[]>();

    const minifiedProducts = rawProducts.map((p) => ({
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
    const formattedHistory = history
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
    let enrichedProducts = [];
    
    if (parsed.intent === "recommend" && Array.isArray(parsed.products)) {
      const index = new Map(rawProducts.map((p) => [p._id.toString(), p]));

      enrichedProducts = parsed.products
        .map((p) => {
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
        .filter(Boolean);
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
