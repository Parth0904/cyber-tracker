import { NextResponse } from "next/server";

import {
  generateCareerSummary,
} from "@/lib/career/summary";

export async function GET() {

  return NextResponse.json(

    generateCareerSummary()

  );

}