import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableFreeze } from "react-native-screens";
import Navigation from "./Navigation";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { ToastHost } from "./components/Toast";
import { UserProvider } from "./context/UserContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { InboxProvider } from "./context/InboxContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { lightColors } from "./theme";

enableFreeze(false);
LogBox.ignoreLogs(["Setting a timer"]);

function ThemedShell({ children }) {
  const { dark, colors } = useSettings();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={dark ? "light" : "dark"} />
      {children}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: lightColors.background }}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: lightColors.background }}>
        <ErrorBoundary>
          <SettingsProvider>
            <ThemedShell>
              <UserProvider>
                <InboxProvider>
                  <Navigation />
                  <ToastHost />
                </InboxProvider>
              </UserProvider>
            </ThemedShell>
          </SettingsProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
