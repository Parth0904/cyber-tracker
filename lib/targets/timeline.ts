type TimelineEvent = {

    date:string;

    type:string;

    title:string;

};

export function buildTimeline(

sessions:any[],

findings:any[]

):TimelineEvent[]{

const events=[

...sessions.map(session=>({

date:session.started_at,

type:"session",

title:`${session.type} Session`

})),

...findings.map(finding=>({

date:finding.submitted_at,

type:"finding",

title:finding.title

}))

];

return events.sort(

(a,b)=>

new Date(b.date).getTime()

-

new Date(a.date).getTime()

);

}