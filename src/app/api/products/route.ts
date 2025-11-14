import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";

export async function GET() {
  await connectDB();
  const products = await Product.find().sort({ createdAt: -1 });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  await connectDB();
  const body = await request.json();

  try {
    const product = await Product.create(body);
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error("Error adding product:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
