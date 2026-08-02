import { one, execute } from "@/lib/database";

export type HealthConnectConfig = {
  status: "Not Connected" | "Connected" | "Permission Denied" | "Unsupported Device";
  simulated_workout: number; // 0 or 1
};

export async function getHealthConnectConfig(): Promise<HealthConnectConfig> {
  const config = await one<HealthConnectConfig>(
    `SELECT status, simulated_workout FROM health_connect_config WHERE id = 1`
  );
  if (!config) {
    return { status: "Not Connected", simulated_workout: 0 };
  }
  return config;
}

export async function updateHealthConnectConfig(
  status: string,
  simulatedWorkout: number
) {
  return await execute(
    `UPDATE health_connect_config
     SET status = ?, simulated_workout = ?
     WHERE id = 1`,
    status,
    simulatedWorkout
  );
}
