import Panel from "@/components/ui/Panel";

type Activity = {
  type: string;
  created_at: string;
};

type Props = {
  activities: Activity[];
};

const icons: Record<string,string>={

learning:"📚",

recon:"🎯",

finding:"🐞",

bug_report:"📝",

target:"🌐",

};

export default function RecentActivity({

activities,

}:Props){

return(

<Panel>

<h2 className="text-xl font-bold">

Recent Activity

</h2>

<div className="mt-6 space-y-5">

{activities.map((activity,index)=>(

<div
key={index}
className="flex items-center gap-4"
>

<div className="text-2xl">

{icons[activity.type]}

</div>

<div className="flex-1">

<p className="capitalize">

{activity.type.replace("_"," ")}

</p>

<p className="text-sm text-slate-500">

{new Date(activity.created_at)
.toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit",
})}

</p>

</div>

</div>

))}

</div>

</Panel>

);

}