import { getCorrelationDiagnostics } from "../lib/services/correlationEngine";

async function run() {
  try {
    console.log("Running getCorrelationDiagnostics...");
    const res = await getCorrelationDiagnostics();
    console.log("Success! Keys in response:", Object.keys(res));
  } catch (err: any) {
    console.error("Error encountered:", err.stack || err.message || err);
  }
}

run();
