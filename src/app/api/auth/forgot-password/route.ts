import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { sendEmail } from "@/lib/mail/nodemailer";
import { getSupplementLankaEmailHtml } from "@/lib/mail/emailTemplate";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
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
        html: getSupplementLankaEmailHtml({
          eyebrow: "Account security",
          title: "Reset your password",
          lead: "We received a request to reset the password for your Supplement Lanka account.",
          actionLabel: "Reset Password",
          actionUrl: resetLink,
          details: [
            { label: "Account", value: normalizedEmail },
            { label: "Request", value: "Password reset" },
            { label: "Status", value: "Link generated" },
            {
              label: "Date",
              value: new Date().toLocaleDateString("en-LK", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            },
          ],
          statusLabel: "Security email",
          waybillLabel: "Reset Link",
          waybillNumber: resetLink,
          footerNote:
            "If you did not request a password reset, you can ignore this email.",
        }),
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
