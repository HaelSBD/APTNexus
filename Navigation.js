import React, { useEffect } from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreenNative from "expo-splash-screen";
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import { useCurrentUser } from "./context/UserContext";
import { useSettings } from "./context/SettingsContext";

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const { user, loading } = useCurrentUser();
  const { dark, colors } = useSettings();

  useEffect(() => {
    SplashScreenNative.hideAsync().catch(() => {});
  }, [loading]);

  if (loading) return <SplashScreen />;

  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (!user) {
    return (
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "none",
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  const AuthedNavigation = require("./AuthedNavigation").default;
  return <AuthedNavigation theme={navTheme} />;
}
