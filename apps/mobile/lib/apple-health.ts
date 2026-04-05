import { Platform } from "react-native";

let AppleHealthKit: any = null;

// Dynamically import to prevent crash when native module isn't available
try {
  if (Platform.OS === "ios") {
    AppleHealthKit = require("react-native-health").default;
  }
} catch {
  // Native module not available (Expo Go or missing native build)
}

const permissions = AppleHealthKit
  ? {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.StepCount,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          AppleHealthKit.Constants.Permissions.DistanceCycling,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.Weight,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.Workout,
        ],
        write: [],
      },
    }
  : null;

export const appleHealth = {
  isAvailable: () => Platform.OS === "ios" && AppleHealthKit != null,

  requestPermissions: (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!appleHealth.isAvailable() || !permissions) {
        resolve(false);
        return;
      }
      AppleHealthKit.initHealthKit(permissions, (err: any) => {
        resolve(!err);
      });
    });
  },

  getDailySteps: (date: Date): Promise<number> => {
    return new Promise((resolve) => {
      if (!AppleHealthKit) {
        resolve(0);
        return;
      }
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      AppleHealthKit.getStepCount(
        { date: end.toISOString(), startDate: start.toISOString() },
        (err: any, results: any) => {
          resolve(err ? 0 : (results?.value ?? 0));
        },
      );
    });
  },

  getWorkouts: (startDate: Date, endDate: Date): Promise<any[]> => {
    return new Promise((resolve) => {
      if (!AppleHealthKit) {
        resolve([]);
        return;
      }
      AppleHealthKit.getSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: "Workout",
        },
        (err: any, results: any) => {
          resolve(err ? [] : (results ?? []));
        },
      );
    });
  },

  getSleep: (startDate: Date, endDate: Date): Promise<any[]> => {
    return new Promise((resolve) => {
      if (!AppleHealthKit) {
        resolve([]);
        return;
      }
      AppleHealthKit.getSleepSamples(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        (err: any, results: any) => {
          resolve(err ? [] : (results ?? []));
        },
      );
    });
  },

  getWeight: (startDate: Date, endDate: Date): Promise<any[]> => {
    return new Promise((resolve) => {
      if (!AppleHealthKit) {
        resolve([]);
        return;
      }
      AppleHealthKit.getWeightSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ascending: false,
          limit: 10,
          unit: "gram",
        },
        (err: any, results: any) => {
          resolve(err ? [] : (results ?? []));
        },
      );
    });
  },

  getHeartRate: (startDate: Date, endDate: Date): Promise<any[]> => {
    return new Promise((resolve) => {
      if (!AppleHealthKit) {
        resolve([]);
        return;
      }
      AppleHealthKit.getHeartRateSamples(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        (err: any, results: any) => {
          resolve(err ? [] : (results ?? []));
        },
      );
    });
  },
};
