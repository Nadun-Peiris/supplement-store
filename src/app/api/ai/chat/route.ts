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
    // 🔐 LOAD USER PROFILE (optional)
    // -----------------------
    let userProfile = null;
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = await adminAuth().verifyIdToken(token);

        const user = await User.findOne({ firebaseId: decoded.uid }).lean();
        if (user) userProfile = user;
      } catch {
        console.log("AI: User is not logged in.");
      }
    }

    // -----------------------
    // 📦 LOAD PRODUCTS FROM MONGO
    // -----------------------
    const products = await Product.find(
      {},
      "name price description category image slug"
    ).lean();

    // -----------------------
    // 🤖 GEMINI SETUP
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
      model: "gemini-2.5-flash", // best stable model
    });

    // -----------------------
    // 🧠 STRUCTURED JSON PROMPT
    // -----------------------
    const prompt = `
You are a professional supplement coach.
You ALWAYS reply in raw JSON with no code fences.

### USER MESSAGE:
"${message}"

### USER PROFILE (optional):
${userProfile ? JSON.stringify(userProfile, null, 2) : "User not logged in"}

### AVAILABLE PRODUCTS:
${JSON.stringify(products, null, 2)}

---

### REQUIRED JSON RESPONSE FORMAT:
{
  "reply": "A short friendly explanation",
  "products": [
    {
      "id": "product._id from the list above",
      "name": "product name",
      "reason": "why you recommend it",
      "score": 0-10
    }
  ]
}

RULES:
- MUST return valid JSON only.
- DO NOT add text before or after JSON or wrap in code fences.
- Products MUST come from the list above only.
- If no good product match → return an empty array.
- Keep reply short and neutral; start with a simple "Hi".
`;

    // -----------------------
    // 🤖 GENERATE AI RESPONSE
    // -----------------------
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const text = rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    let parsed;

    // Validate & parse JSON
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      console.error("❌ AI returned invalid JSON:", text);

      parsed = {
        reply: text || "I couldn't respond properly, try again.",
        products: [],
      };
    }

    // Safety cleanup
    if (!parsed.reply) parsed.reply = "Here’s my recommendation!";
    if (!Array.isArray(parsed.products)) parsed.products = [];

    // Merge AI product refs with real product data so the chat can show images/price
    const productIndex = new Map(
      products.map((p: any) => [p._id.toString(), p])
    );

    const enrichedProducts = parsed.products
      .map((p: any) => {
        const match = productIndex.get(p.id);
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

    return NextResponse.json({
      reply: parsed.reply,
      products: enrichedProducts,
    });
  } catch (err) {
    console.error("AI Chat Error:", err);
    return NextResponse.json(
      {
        reply:
          "I couldn't reach the AI right now. Please try again shortly.",
        error: "AI failed to respond",
      },
      { status: 500 }
    );
  }
}
