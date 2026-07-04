import { TargetFinding } from "@/lib/repositories/targetFindings";

export function generateFindingStatistics(

findings:TargetFinding[]

){

return{

total:findings.length,

draft:findings.filter(
f=>f.status==="Draft"
).length,

submitted:findings.filter(
f=>f.status==="Submitted"
).length,

valid:findings.filter(
f=>f.status==="Valid"
).length,

duplicates:findings.filter(
f=>f.status==="Duplicate"
).length,

reward:

findings.reduce(

(sum,f)=>

sum+f.reward,

0

),

};

}