import { NextResponse } from "next/server";
import { getFinding, deleteFinding } from "@/lib/repositories/targetFindings";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const findingId = Number(id);

    const existing = await getFinding(findingId);
    if (!existing) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    await deleteFinding(findingId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete finding:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
