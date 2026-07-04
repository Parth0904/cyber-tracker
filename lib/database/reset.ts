import fs from "fs";

if (
  fs.existsSync("tracker.db")
) {
  fs.unlinkSync("tracker.db");
}

console.log(
  "Database deleted."
);