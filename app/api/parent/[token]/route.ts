import { NextRequest, NextResponse } from "next/server";
import {
  verifyAndGetParentPortalToken,
  isTokenRevoked,
} from "@/lib/repositories/parentPortalTokens";
import { compileParentPortalData } from "@/lib/services/parentPortal/portalData";
import { APP_TIMEZONE } from "@/lib/services/metrics/dates";

export const dynamic = "force-dynamic";

/**
 * GET /api/parent/[token]
 * Dedicated, strictly read-only endpoint for Parent Portal.
 * 
 * Security:
 * - Validates the cryptographic token hash before returning any data.
 * - Distinct handling for revoked vs non-existent tokens.
 * - Exposes zero secrets, credentials, or write operations.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        { error: "not_found", message: "Invalid parent portal access link." },
        { status: 404 }
      );
    }

    const tokenRecord = await verifyAndGetParentPortalToken(token.trim());

    if (!tokenRecord) {
      const revoked = await isTokenRevoked(token.trim());
      if (revoked) {
        return NextResponse.json(
          {
            error: "revoked",
            message: "This parent access link has been revoked.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "not_found", message: "Invalid parent portal access link." },
        { status: 404 }
      );
    }

    // Parse optional month / year navigation query parameters
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    const month = monthParam ? parseInt(monthParam, 10) : undefined;

    const data = await compileParentPortalData({
      tokenRecord,
      year: year && !isNaN(year) ? year : undefined,
      month: month && !isNaN(month) ? month : undefined,
      timezone: APP_TIMEZONE,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("Parent Portal API error:", err);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to load parent portal data." },
      { status: 500 }
    );
  }
}

// Strictly enforce read-only boundary
export async function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
