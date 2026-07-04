import Panel from "@/components/ui/Panel";

type Props = {
  averageScore: number;

  totalActivities: number;

  readingAverage: number;

  sleepAverage: number;

  bestHabit: string;
};

export default function MonthlySnapshot({

  averageScore,

  totalActivities,

  readingAverage,

  sleepAverage,

  bestHabit,

}:Props){

const stats=[

{
label:"Average Score",
value:averageScore,
},

{
label:"Activities",
value:totalActivities,
},

{
label:"Reading",
value:`${readingAverage} min/day`,
},

{
label:"Sleep",
value:`${sleepAverage} hrs`,
},

{
label:"Best Habit",
value:bestHabit,
},

];

return(

<Panel>

<h2 className="text-xl font-bold">

Monthly Snapshot

</h2>

<div className="mt-6 space-y-4">

{stats.map((item)=>(

<div
key={item.label}
className="flex justify-between border-b border-slate-800 pb-3"
>

<span className="text-slate-400">

{item.label}

</span>

<span className="font-semibold">

{item.value}

</span>

</div>

))}

</div>

</Panel>

);

}