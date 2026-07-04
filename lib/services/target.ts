import { createTarget } from "@/lib/repositories/targets";

export function createNewTarget(body: any) {

  return createTarget({

    name: body.name,

    platform: body.platform,

    url: body.url ?? "",

    status: body.status ?? "Recon",

    priority: body.priority ?? "P2",

    started_at:
      body.started_at ??
      new Date().toISOString(),

    last_activity:
      body.last_activity ??
      new Date().toISOString(),

    notes: body.notes ?? "",

    category: body.category ?? "",

    scope_url:
      body.scope_url ??
      body.url ??
      "",

    program_url:
      body.program_url ??
      body.url ??
      "",

    created_by:
      body.created_by ??
      "Parth",

    archived: 0,

  });

}