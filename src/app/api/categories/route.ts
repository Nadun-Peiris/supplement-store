import { NextResponse } from "next/server";
import Category from "@/models/Category";
import { connectDB } from "@/lib/mongoose";

export async function GET() {
  await connectDB();
  const categories = await Category.find({});
  return NextResponse.json({ categories });
}
