import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { sendEmail } from "@/lib/mail/nodemailer";

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
        subject: "Reset your Supplement Store password",
        html: `
          <div style="margin: 0; background-color: #eef2f7; padding: 32px 12px; font-family: Arial, sans-serif; color: #1f2937;">
            <div style="margin: 0 auto; max-width: 600px; overflow: hidden; border: 1px solid #d9e2ec; border-radius: 14px; background-color: #ffffff;">
              <div style="background-color: #12b8eb; padding: 28px 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff;">
                  Supplement Store Admin
                </h1>
              </div>
              <div style="padding: 32px 24px 36px;">
                <h2 style="margin: 0 0 20px; font-size: 22px; line-height: 1.3; color: #111827;">
                  Reset your password
                </h2>
                <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.7; color: #374151;">
                  We received a request to reset the password for your account.
                </p>
                <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: #374151;">
                  Click the button below to choose a new password:
                </p>
                <div style="margin: 0 0 32px; text-align: center;">
                  <a
                    href="${resetLink}"
                    style="display: inline-block; border-radius: 12px; background-color: #12b8eb; padding: 14px 24px; font-size: 18px; font-weight: 700; color: #ffffff; text-decoration: none;"
                  >
                    Reset Password
                  </a>
                </div>
                <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.7; color: #667085;">
                  If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0 0 28px; word-break: break-word;">
                  <a href="${resetLink}" style="font-size: 14px; line-height: 1.8; color: #0b63ce; text-decoration: underline;">
                    ${resetLink}
                  </a>
                </p>
                <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #667085;">
                  If you did not request a password reset, you can ignore this email.
                </p>
              </div>
            </div>
          </div>
        `,
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
