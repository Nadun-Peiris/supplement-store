import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { sendEmail } from "@/lib/mail/nodemailer";
import { renderPasswordResetEmail } from "@/lib/mail/emailTemplate";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 5 * 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const forgotPasswordRateLimit = new Map<string, { count: number; resetAt: number }>();

const getClientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip") ||
  "unknown";

const isRateLimited = (clientId: string) => {
  const now = Date.now();
  const entry = forgotPasswordRateLimit.get(clientId);

  if (!entry || entry.resetAt <= now) {
    forgotPasswordRateLimit.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
};

export async function POST(req: Request) {
  try {
    const clientId = getClientIp(req);
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: "Too many reset requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    try {
      const resetLink = await adminAuth().generatePasswordResetLink(
        normalizedEmail
      );

      const sent = await sendEmail({
        to: normalizedEmail,
        subject: "Reset your Supplement Lanka password",
        html: renderPasswordResetEmail({ resetLink }),
      });

      if (!sent) {
        return NextResponse.json(
          { error: "Failed to send reset email." },
          { status: 500 }
        );
      }
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: string }).code === "string"
          ? (error as { code: string }).code
          : null;

      // Keep the response generic to avoid account enumeration.
      if (code !== "auth/user-not-found") {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
