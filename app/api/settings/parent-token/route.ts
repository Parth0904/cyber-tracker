import { NextRequest, NextResponse } from "next/server";
import {
  createParentPortalToken,
  getAllParentPortalTokens,
} from "@/lib/repositories/parentPortalTokens";

export const dynamic = "force-dynamic";

/**
 * GET /api/settings/parent-token
 * Owner-only route to list parent portal tokens.
 * Authentication enforced by proxy.ts middleware.
 */
export async function GET() {
  try {
    const tokens = await getAllParentPortalTokens();
    return NextResponse.json({
      success: true,
      tokens,
    });
  } catch (err: any) {
    console.error("Failed fetching parent portal tokens:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/parent-token
 * Owner-only route to generate a new parent portal share token.
 * Returns the rawToken ONCE for copying by the owner.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const label = typeof body?.label === "string" ? body.label.trim() : null;

    const { rawToken, tokenRecord } = await createParentPortalToken({
      label,
    });

    return NextResponse.json({
      success: true,
      token: rawToken,
      tokenRecord,
    });
  } catch (err: any) {
    console.error("Failed creating parent portal token:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}
