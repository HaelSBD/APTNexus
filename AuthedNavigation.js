import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AppTabBar from "./components/AppTabBar";
import { isAdminRole } from "./utils/roles";
import { useCurrentUser } from "./context/UserContext";
import { useSettings } from "./context/SettingsContext";
import { useDutyTracking } from "./utils/locationTrack";

import HomeScreen from "./screens/HomeScreen";
import SecurityPatrolScreen from "./screens/SecurityPatrolScreen";
import IDScreen from "./screens/IDScreen";
import SecurityRegisterVisitor from "./screens/SecurityRegisterVisitor";
import ProfileScreen from "./screens/ProfileScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SecurityCameraScan from "./screens/SecurityCameraScan";
import InboxScreen from "./screens/InboxScreen";
import ChatScreen from "./screens/ChatScreen";
import DutyBoardScreen from "./screens/DutyBoardScreen";
import VisitorsLogScreen from "./screens/VisitorsLogScreen";
import TeamScreen from "./screens/TeamScreen";
import TeamCreateScreen from "./screens/TeamCreateScreen";
import TeamMemberScreen from "./screens/TeamMemberScreen";
import SitesScreen from "./screens/SitesScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const useTabScreenOptions = () => {
  const { colors } = useSettings();
  return {
    headerShown: false,
    tabBarHideOnKeyboard: true,
    animation: "none",
    freezeOnBlur: false,
    lazy: true,
    sceneStyle: { backgroundColor: colors.background },
  };
};

const SecurityTabs = () => {
  const tabScreenOptions = useTabScreenOptions();
  return (
  <Tab.Navigator detachInactiveScreens={false} tabBar={(props) => <AppTabBar {...props} />} screenOptions={tabScreenOptions}>
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Home" }} />
    <Tab.Screen name="Patrol" component={SecurityPatrolScreen} />
    <Tab.Screen name="ID" component={IDScreen} options={{ tabBarLabel: "ID" }} />
    <Tab.Screen name="Chat" component={ChatScreen} />
    <Tab.Screen name="Gate" component={SecurityRegisterVisitor} />
  </Tab.Navigator>
  );
};

const AdminTabs = () => {
  const tabScreenOptions = useTabScreenOptions();
  return (
  <Tab.Navigator detachInactiveScreens={false} tabBar={(props) => <AppTabBar {...props} />} screenOptions={tabScreenOptions}>
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Home" }} />
    <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarLabel: "Team" }} />
    <Tab.Screen name="ID" component={IDScreen} options={{ tabBarLabel: "ID" }} />
    <Tab.Screen name="Chat" component={ChatScreen} />
    <Tab.Screen name="Duty" component={DutyBoardScreen} />
  </Tab.Navigator>
  );
};

const MainTabs = () => {
  const { profile, user } = useCurrentUser();
  if (isAdminRole(profile || user)) return <AdminTabs />;
  return <SecurityTabs />;
};

function DutyTracker() {
  const { user, duty } = useCurrentUser();
  const { settings } = useSettings();
  useDutyTracking(Boolean(user && duty.clockedIn), Boolean(isAdminRole(user) && settings.highAccuracyGps));
  return null;
}

export default function AuthedNavigation({ theme }) {
  const { colors } = useSettings();
  return (
    <>
      <DutyTracker />
      <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: colors.background },
          freezeOnBlur: false,
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Notifications" component={InboxScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Visitors" component={VisitorsLogScreen} />
        <Stack.Screen name="TeamCreate" component={TeamCreateScreen} />
        <Stack.Screen name="TeamMember" component={TeamMemberScreen} />
        <Stack.Screen name="Sites" component={SitesScreen} />
        <Stack.Screen name="SecurityCameraScan" component={SecurityCameraScan} />
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}
