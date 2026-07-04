import { NextResponse } from "next/server";

import {
  createFinding,
  getAllFindings,
} from "@/lib/repositories/targetFindings";

export async function GET() {

  return NextResponse.json(
    getAllFindings()
  );

}

export async function POST(
  req: Request
) {

  const body =
    await req.json();

  createFinding(body);

  return NextResponse.json({

    success: true,

  });

}