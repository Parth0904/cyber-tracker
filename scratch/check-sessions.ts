import "dotenv/config";
import { many } from "../lib/database";

async function check() {
  try {
    console.log("Checking targets...");
    const targets = await many("SELECT * FROM targets");
    console.log("Targets:", JSON.stringify(targets, null, 2));

    console.log("\nChecking target_sessions...");
    const targetSessions = await many("SELECT * FROM target_sessions");
    console.log("Target Sessions:", JSON.stringify(targetSessions, null, 2));

    console.log("\nChecking learning_sessions...");
    const learningSessions = await many("SELECT * FROM learning_sessions");
    console.log("Learning Sessions:", JSON.stringify(learningSessions, null, 2));
  } catch (err: any) {
    console.error("Error:", err.stack || err.message || err);
  }
}

check();
