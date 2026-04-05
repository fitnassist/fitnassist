require("dotenv").config();
const os = require("os");

const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};

const localIp = getLocalIp();

module.exports = {
  expo: {
    name: "Fitnassist",
    slug: "fitnassist",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    scheme: "fitnassist",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "cover",
      backgroundColor: "#3d2743",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.fitnassist.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSHealthShareUsageDescription:
          "Fitnassist reads your health data to track your fitness progress.",
        NSHealthUpdateUsageDescription:
          "Fitnassist can save workout data to Apple Health.",
        NSCameraUsageDescription:
          "Fitnassist needs camera access for video calls.",
        NSMicrophoneUsageDescription:
          "Fitnassist needs microphone access for video calls.",
      },
      entitlements: {
        "com.apple.developer.healthkit": true,
        "com.apple.developer.healthkit.access": ["health-records"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.fitnassist.app",
    },
    plugins: ["expo-router", "expo-secure-store"],
    extra: {
      apiUrl: process.env.API_URL ?? `http://${localIp}:3001`,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
      eas: {
        projectId: "4b531d57-b46f-4b2e-99f0-eea3800ba1b5",
      },
      router: {
        origin: false,
      },
    },
  },
};
