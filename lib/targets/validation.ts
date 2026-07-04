import { z } from "zod";

export const TargetSchema = z.object({

    name: z.string().min(2),

    platform: z.string().min(2),

    scope_url: z.string().url(),

    program_url: z.string().url(),

    status: z.enum([
        "Recon",
        "Testing",
        "Reporting",
        "Paused",
        "Completed",
    ]),

    priority: z.enum([
        "Low",
        "Medium",
        "High",
        "Critical",
    ]),

    notes: z.string(),

});