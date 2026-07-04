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

export function generateTargetOverview(
    id:number
){

    const target =
        getTarget(id);

    if(!target)
        return null;

    const sessions =
        getSessions(id);

    const findings =
        getFindings(id);

    return{

        target,

        statistics:
            generateTargetStatistics(id),

        sessions,

        findings,

        timeline:
            buildTimeline(
                sessions,
                findings
            ),

    };

}