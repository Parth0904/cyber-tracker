import { NextResponse } from "next/server";

import {
  getAllSessions,
  getCurrentSession,
} from "@/lib/repositories/targetSessions";

export async function GET() {

  const sessions =
    getAllSessions();

  return NextResponse.json({

    active:
      getCurrentSession(),

    sessions:
      sessions.map(session => ({

        id:
          String(session.id),

        targetId:
          String(session.target_id),

        targetName:
          session.target,

        type:
          session.type,

        description:
          session.description ?? "",

        start:
          session.started_at,

        end:
          session.ended_at,

        durationHours:
          session.duration / 60,

        status:
          session.ended_at
            ? "Completed"
            : "Running",

      })),

  });

}