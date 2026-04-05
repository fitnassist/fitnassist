import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

const BookingDetailLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    />
  );
};

export default BookingDetailLayout;
