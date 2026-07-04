export function acceptanceRate(

valid:number,

submitted:number

){

if(submitted===0){

return 0;

}

return Math.round(

(valid/submitted)*100

);

}