import fs from "fs";

const now =
new Date()
.toISOString()
.replace(/:/g,"-");

fs.copyFileSync(

"tracker.db",

`backup-${now}.db`

);

console.log(
"Backup created."
);