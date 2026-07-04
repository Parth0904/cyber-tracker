import Panel from "@/components/ui/Panel";

type Props = {

  current:number;

  longest:number;

  completed:number;

  rate:number;

};

export default function StreakSummary({

current,

longest,

completed,

rate,

}:Props){

return(

<Panel>

<h2 className="text-xl font-bold">

Streak Statistics

</h2>

<div className="grid grid-cols-2 gap-6 mt-8">

<div>

<p className="text-slate-500">

Current

</p>

<p className="text-4xl font-black">

{current}

</p>

</div>

<div>

<p className="text-slate-500">

Longest

</p>

<p className="text-4xl font-black">

{longest}

</p>

</div>

<div>

<p className="text-slate-500">

Completed Days

</p>

<p className="text-4xl font-black">

{completed}

</p>

</div>

<div>

<p className="text-slate-500">

Completion Rate

</p>

<p className="text-4xl font-black">

{rate}%

</p>

</div>

</div>

</Panel>

);

}