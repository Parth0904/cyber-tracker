import {
  Target,
  Clock,
  Bug,
  FileText,
} from "lucide-react";

import StatGrid from "@/components/ui/StatGrid";

import MetricCard from "@/components/ui/MetricCard";

type Props = {

  targets:number;

  hours:number;

  findings:number;

  reports:number;

};

export default function TargetStatistics({

targets,

hours,

findings,

reports,

}:Props){

return(

<StatGrid>

<MetricCard
title="Targets"
value={targets}
icon={<Target size={28}/>}
/>

<MetricCard
title="Hours"
value={hours}
icon={<Clock size={28}/>}
/>

<MetricCard
title="Findings"
value={findings}
icon={<Bug size={28}/>}
/>

<MetricCard
title="Reports"
value={reports}
icon={<FileText size={28}/>}
/>

</StatGrid>

);

}