import { NextRequest, NextResponse } from "next/server";
import {
  revokeParentPortalToken,
  revokeAllParentPortalTokens,
} from "@/lib/repositories/parentPortalTokens";

export const dynamic = "force-dynamic";

/**
 * POST /api/settings/parent-token/revoke
 * Owner-only route to revoke a parent portal token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body?.all === true) {
      await revokeAllParentPortalTokens();
      return NextResponse.json({
        success: true,
        message: "All parent portal tokens revoked.",
      });
    }

    const id = body?.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Bad Request", message: "Token ID is required to revoke." },
        { status: 400 }
      );
    }

    await revokeParentPortalToken(id);

    return NextResponse.json({
      success: true,
      message: "Parent portal token revoked successfully.",
    });
  } catch (err: any) {
    console.error("Failed revoking parent portal token:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}
