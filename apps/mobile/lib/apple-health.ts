import AppleHealthKit, { HealthKitPermissions } from "react-native-health";
import { Platform } from "react-native";

const permissions: HealthKitPermissions = {
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
};

export const appleHealth = {
  isAvailable: () => Platform.OS === "ios",

  requestPermissions: (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!appleHealth.isAvailable()) {
        resolve(false);
        return;
      }
      AppleHealthKit.initHealthKit(permissions, (err) => {
        resolve(!err);
      });
    });
  },

  getSteps: (startDate: Date, endDate: Date): Promise<number> => {
    return new Promise((resolve) => {
      AppleHealthKit.getStepCount(
        { date: endDate.toISOString(), startDate: startDate.toISOString() },
        (err, results) => {
          resolve(err ? 0 : (results?.value ?? 0));
        },
      );
    });
  },

  getDailySteps: (date: Date): Promise<number> => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return appleHealth.getSteps(start, end);
  },

  getWorkouts: (startDate: Date, endDate: Date): Promise<any[]> => {
    return new Promise((resolve) => {
      AppleHealthKit.getSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: "Workout",
        },
        (err, results) => {
          resolve(err ? [] : (results ?? []));
        },
      );
    });
  },

  getSleep: (startDate: Date, endDate: Date): Promise<any[]> => {
    return new Promise((resolve) => {
      AppleHealthKit.getSleepSamples(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        (err, results) => {
          resolve(err ? [] : (results ?? []));
        },
      );
    });
  },

  getWeight: (startDate: Date, endDate: Date): Promise<any[]> => {
    return new Promise((resolve) => {
      AppleHealthKit.getWeightSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ascending: false,
          limit: 10,
          unit: AppleHealthKit.Constants.Units.gram,
        },
        (err, results) => {
          resolve(err ? [] : (results ?? []));
        },
      );
    });
  },

  getHeartRate: (startDate: Date, endDate: Date): Promise<any[]> => {
    return new Promise((resolve) => {
      AppleHealthKit.getHeartRateSamples(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        (err, results) => {
          resolve(err ? [] : (results ?? []));
        },
      );
    });
  },
};
