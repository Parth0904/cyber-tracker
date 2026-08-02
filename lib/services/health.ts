import { getHealthConnectConfig } from "@/lib/repositories/health";
import { getTodayEntry, saveDailyEntry } from "@/lib/repositories/dailyEntries";
import { DailyEntry } from "@/lib/types";

// Reusable Health Data Provider Interface for Future Expansion
export interface HealthDataProvider {
  getWorkoutStatusToday(todayStr: string): Promise<boolean>;
  // Future extension endpoints:
  // getSleepData(todayStr: string): Promise<any>;
  // getHeartRateData(todayStr: string): Promise<any>;
}

// Simulated Android Health Connect Native Bridge Implementation
export class HealthConnectProvider implements HealthDataProvider {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async getWorkoutStatusToday(todayStr: string): Promise<boolean> {
    if (this.config.status !== "Connected") {
      throw new Error(`Health Connect is not connected. Current state: ${this.config.status}`);
    }
    return this.config.simulated_workout === 1;
  }
}

export type SyncResult = {
  status: string;
  synced: boolean;
  workoutCompleted?: boolean;
  message?: string;
};

// Core Health Service
export async function syncHealthDataToday(): Promise<SyncResult> {
  const config = await getHealthConnectConfig();
  
  if (config.status !== "Connected") {
    return {
      status: config.status,
      synced: false,
      message: `Sync bypassed. Connection status: ${config.status}`
    };
  }

  const provider = new HealthConnectProvider(config);
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const workoutCompleted = await provider.getWorkoutStatusToday(todayStr);
    
    // Fetch today's local daily entry
    let entry = await getTodayEntry(todayStr);
    
    if (entry) {
      entry.workout = workoutCompleted ? 1 : 0;
    } else {
      entry = {
        date: todayStr,
        sleep_hours: 0,
        bed_time: "",
        wake_time: "",
        reading: 0,
        focus_feeling: "Focused",
        workout: workoutCompleted ? 1 : 0,
        steps: 0,
        notes: ""
      };
    }

    await saveDailyEntry(entry);

    return {
      status: "Connected",
      synced: true,
      workoutCompleted
    };
  } catch (err: any) {
    console.error("Health Connect synchronization error:", err);
    return {
      status: config.status,
      synced: false,
      message: err.message || "Unknown synchronization error"
    };
  }
}
