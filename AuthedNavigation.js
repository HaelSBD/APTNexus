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
import SecurityRegisterVisitor from "./screens/SecurityRegisterVisitor";
import ProfileScreen from "./screens/ProfileScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SecurityCameraScan from "./screens/SecurityCameraScan";
import InboxScreen from "./screens/InboxScreen";
import VisitorsLogScreen from "./screens/VisitorsLogScreen";
import TeamScreen from "./screens/TeamScreen";
import TeamCreateScreen from "./screens/TeamCreateScreen";
import TeamMemberScreen from "./screens/TeamMemberScreen";
import SitesScreen from "./screens/SitesScreen";
import CheckpointsScreen from "./screens/CheckpointsScreen";
// IDScreen kept on disk but not registered — re-enable later if the client wants it:
// import IDScreen from "./screens/IDScreen";

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
      <Tab.Screen name="Gate" component={SecurityRegisterVisitor} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const AdminTabs = () => {
  const tabScreenOptions = useTabScreenOptions();
  return (
    <Tab.Navigator detachInactiveScreens={false} tabBar={(props) => <AppTabBar {...props} />} screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarLabel: "Teams" }} />
      <Tab.Screen name="Visitors" component={VisitorsLogScreen} options={{ tabBarLabel: "Visitors" }} />
      <Tab.Screen name="Patrol" component={SecurityPatrolScreen} />
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
  // Security on-duty trail uses high accuracy for checkpoint credibility. Admins are not tracked.
  useDutyTracking(Boolean(user && duty.clockedIn && !isAdminRole(user)), true);
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
          <Stack.Screen name="TeamCreate" component={TeamCreateScreen} />
          <Stack.Screen name="TeamMember" component={TeamMemberScreen} />
          <Stack.Screen name="Sites" component={SitesScreen} />
          <Stack.Screen name="Checkpoints" component={CheckpointsScreen} />
          <Stack.Screen name="SecurityCameraScan" component={SecurityCameraScan} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
