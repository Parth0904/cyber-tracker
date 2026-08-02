import {
    getTarget,
} from "@/lib/repositories/targets";

import {
    getSessions,
} from "@/lib/repositories/targetSessions";

import {
    getFindings,
} from "@/lib/repositories/targetFindings";

import {
    generateTargetStatistics,
} from "./statistics";

import {
    buildTimeline,
} from "./timeline";

export async function generateTargetOverview(
    id:number
){

    const target =
        await getTarget(id);

    if(!target)
        return null;

    const sessions =
        await getSessions(id);

    const findings =
        await getFindings(id);

    return{

        target,

        statistics:
            await generateTargetStatistics(id),

        sessions,

        findings,

        timeline:
            buildTimeline(
                sessions,
                findings
            ),

    };

}