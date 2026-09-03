import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import MapScreen from "./src/screens/MapScreen";
import FarmInspectionScreen from "./src/screens/FarmInspectionScreen";

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  FarmInspection: { detectionId: string };
};

export type TabParamList = {
  Dashboard: undefined;
  Map: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: "Live Map" }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, isCheckingSession } = useAuth();

  if (isCheckingSession) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1F6B3B" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Tabs" component={MainTabs} />
          <Stack.Screen
            name="FarmInspection"
            component={FarmInspectionScreen}
            options={{ headerShown: true, title: "Farm Inspection" }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
});
