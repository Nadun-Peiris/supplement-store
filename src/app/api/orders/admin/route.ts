import { NextResponse } from "next/server";
export async function GET(req: Request) {
  void req;
  // Intentionally disabled in the ecommerce app.
  // Admin order management must go through supplement-store-admin to avoid drift.
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(req: Request) {
  void req;
  // Intentionally disabled in the ecommerce app.
  // Admin order management must go through supplement-store-admin to avoid drift.
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
