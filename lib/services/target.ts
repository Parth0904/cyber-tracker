import { createTarget } from "@/lib/repositories/targets";

export async function createNewTarget(body: any) {

  return await createTarget({

    name: body.name,

    platform: "General",

    url: "",

    status: "Active" as any,

    priority: "Medium" as any,

    started_at: new Date().toISOString(),

    last_activity: new Date().toISOString(),

    notes: "",

    category: "",

    scope_url: "",

    program_url: "",

    created_by: "Parth",

    archived: 0,

  });

}