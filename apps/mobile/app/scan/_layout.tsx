import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

const ScanLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_bottom",
      }}
    />
  );
};

export default ScanLayout;
