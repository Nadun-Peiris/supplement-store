import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminAuth } from "@/lib/firebaseAdmin";
import "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Product from "@/models/Product";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // -----------------------
    // 🔐 LOAD USER PROFILE
    // -----------------------
    let userProfile: any = null;
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
    // 📦 LOAD PRODUCTS
    // -----------------------
    const products = await Product.find(
      {},
      "name price description category image slug"
    ).lean();

    // -----------------------
    // 🤖 GEMINI MODEL SETUP
    // -----------------------
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
    });

    // -----------------------
    // 🧠 SUPPLEMENT EXPERT PROMPT
    // -----------------------
    const prompt = `
You are a certified Sri Lankan Supplement Expert. 
You deeply understand:
- Sports nutrition
- Elder-friendly supplement safety
- Muscle gain, strength, fat loss, recovery
- Heart-safe, joint-safe, stimulant-free recommendations
- Protein types, creatine, omega-3, collagen, vitamins

### Supplement Knowledge Guide:
Protein → recovery, muscle repair, weight control  
Creatine → strength, power, muscle preservation (elder-safe)  
Pre-workout → usually high caffeine; avoid for elders or heart issues  
Mass gainer → high calories; avoid diabetics  
Omega-3 → heart, joints, inflammation (excellent for elders)  
Collagen → joints, skin elasticity (elder-friendly)  
Multivitamin → general health, immunity  
Fat burner → stimulant-heavy; avoid for elders and heart patients  

### Elder Rules (strict):
- Avoid stimulants: pre-workouts, fat burners  
- Prefer omega-3, collagen, creatine, vitamins  
- Gentle products only  

### USER MESSAGE:
"${message}"

### USER PROFILE:
${userProfile ? JSON.stringify(userProfile, null, 2) : "User not logged in"}

### STORE PRODUCTS:
${JSON.stringify(products, null, 2)}

---

### YOU MUST RETURN RAW VALID JSON ONLY.
NO text before or after. NO code fences.

### JSON FORMAT:
{
  "reply": "friendly explanation",
  "products": [
    {
      "id": "product._id from store list",
      "name": "product name",
      "reason": "why you chose it",
      "score": 0-10
    }
  ]
}

Rules:
- Match products ONLY from provided list.
- Think like a supplement coach.
- Consider user age, goals, conditions.
- If user age ≥ 50 → enforce elder safety rules.
- Keep reply short, simple, friendly.
`;

    // -----------------------
    // 🤖 GET AI RESPONSE
    // -----------------------
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Remove accidental code fences if any
    const cleaned = raw
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    let parsed: any;

    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ AI returned invalid JSON:", cleaned);
      parsed = {
        reply: "I couldn't fully understand, but here's my suggestion.",
        products: [],
      };
    }

    if (!parsed.reply) parsed.reply = "Here’s a recommendation!";
    if (!Array.isArray(parsed.products)) parsed.products = [];

    // -----------------------
    // 🧩 ENRICH PRODUCT DATA FOR UI
    // -----------------------
    const index = new Map(products.map((p: any) => [p._id.toString(), p]));

    const enriched = parsed.products
      .map((p: any) => {
        const match = index.get(p.id);
        if (!match) return null;

        return {
          id: match._id.toString(),
          name: match.name,
          price: match.price,
          image: match.image,
          slug: match.slug,
          reason: p.reason || "",
          score: typeof p.score === "number" ? p.score : undefined,
        };
      })
      .filter(Boolean);

    // -----------------------
    // SEND TO FRONTEND
    // -----------------------
    return NextResponse.json({
      reply: parsed.reply,
      products: enriched,
    });
  } catch (err) {
    console.error("AI Chat Error:", err);
    return NextResponse.json(
      {
        reply: "The AI is busy at the moment. Please try again shortly.",
        error: "AI failed",
      },
      { status: 500 }
    );
  }
}
