import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";
import { ToastProvider } from "@/components/ui";
import { DesignSystemShowcase } from "@/screens/dev/DesignSystemShowcase";

function AppContent() {
  const { theme } = useTheme();
  return (
    <>
      <DesignSystemShowcase />
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0A1730" }}>
        <ActivityIndicator color="#C9A227" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
