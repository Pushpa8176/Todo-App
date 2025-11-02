import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform } from "react-native";

// ✅ Dynamic Clerk imports for both Web & Expo
let SignedIn, SignedOut;
if (Platform.OS === "web") {
  const clerkReact = require("@clerk/clerk-react");
  SignedIn = clerkReact.SignedIn;
  SignedOut = clerkReact.SignedOut;
} else {
  const clerkExpo = require("@clerk/clerk-expo");
  SignedIn = clerkExpo.SignedIn;
  SignedOut = clerkExpo.SignedOut;
}

// ✅ Import Screens
import SignInScreen from "../screens/SignInScreen";
import HomeScreen from "../screens/HomeScreen";
import GroupsScreen from "../screens/GroupsScreen";
import TodoScreen from "../screens/TodoScreen"; // ✅ Added back

const Stack = createNativeStackNavigator();

export default function MainNavigation() {
  return (
    <NavigationContainer>
      <SignedOut>
        <Stack.Navigator>
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </SignedOut>

      <SignedIn>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Home" }}
          />
          <Stack.Screen
            name="Groups"
            component={GroupsScreen}
            options={{ title: "Groups" }}
          />
          <Stack.Screen
            name="Todos"
            component={TodoScreen}
            options={({ route }) => ({
              title: route.params?.groupName
                ? `Todos - ${route.params.groupName}`
                : "My Todos",
            })}
          />
        </Stack.Navigator>
      </SignedIn>
    </NavigationContainer>
  );
}
