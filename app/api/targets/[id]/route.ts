import { NextRequest, NextResponse } from "next/server";

import {
  getTarget,
  updateTarget,
  deleteTarget,
  archiveTarget,
  restoreTarget,
} from "@/lib/repositories/targets";

import {
  generateTargetOverview,
} from "@/lib/targets/overview";

export async function GET(
  _: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await params;

  const overview = await generateTargetOverview(
    Number(id)
  );

  if (!overview) {
    return NextResponse.json(
      {
        error: "Target not found",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(
    overview
  );
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "archive" || body.status === "Archived" || body.archived === 1) {
    await archiveTarget(Number(id));
  } else if (body.action === "restore" || body.status === "Active" || body.archived === 0) {
    await restoreTarget(Number(id));
  } else {
    const existing = await getTarget(Number(id));
    await updateTarget(Number(id), {
      name: body.name !== undefined ? body.name : (existing?.name || ""),
      platform: body.platform !== undefined ? body.platform : (existing?.platform || ""),
      url: body.url !== undefined ? body.url : (existing?.url || null),
      status: body.status !== undefined ? body.status : (existing?.status || "Recon"),
      priority: body.priority !== undefined ? body.priority : (existing?.priority || "P2"),
      started_at: body.started_at !== undefined ? body.started_at : (existing?.started_at || new Date().toISOString()),
      last_activity: body.last_activity !== undefined ? body.last_activity : (existing?.last_activity || null),
      notes: body.notes !== undefined ? body.notes : (existing?.notes || ""),
      category: body.category !== undefined ? body.category : (existing?.category || null),
      scope_url: body.scope_url !== undefined ? body.scope_url : (existing?.scope_url || null),
      program_url: body.program_url !== undefined ? body.program_url : (existing?.program_url || null),
      created_by: body.created_by !== undefined ? body.created_by : (existing?.created_by || null),
      archived: body.archived !== undefined ? body.archived : (existing?.archived || 0),
    });
  }

  return NextResponse.json({
    success: true,
  });
}

export async function DELETE(
  _: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await params;
  await deleteTarget(Number(id));
  return NextResponse.json({
    success: true,
  });
}