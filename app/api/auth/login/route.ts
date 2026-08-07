import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPassword, createSessionToken } from "@/lib/auth";
import { isRateLimited, recordFailedAttempt, clearFailedAttempts } from "@/lib/rateLimiter";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  // Check rate limiting (5 failed attempts per 15 minutes)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in 15 minutes." },
      { status: 429 }
    );
  }

  // To prevent information leakage, all failure paths will return the exact same response
  const genericErrorResponse = () => {
    recordFailedAttempt(ip);
    return NextResponse.json(
      { error: "Invalid credentials. Please try again." },
      { status: 401 }
    );
  };

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.password !== "string") {
      return genericErrorResponse();
    }

    const isValid = await verifyPassword(body.password);
    if (!isValid) {
      return genericErrorResponse();
    }

    // Success! Clear failed attempts for this IP
    clearFailedAttempts(ip);

    // Rotate/generate new session token
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    const token = createSessionToken(expiresAt);

    const cookieStore = await cookies();
    // Explicitly delete any old session cookie to rotate
    cookieStore.delete("session");
    
    // Set the new rotated session cookie
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return genericErrorResponse();
  }
}
