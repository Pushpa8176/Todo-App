import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform } from "react-native";
import TestSupabaseScreen from "./src/screens/TestSupabaseScreen";
import TodoScreen from "./src/screens/TodoScreen";


// ✅ Dynamically load correct Clerk components based on platform
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

import ClerkProviderWrapper from "./src/providers/ClerkProviderWrapper";
import SignInScreen from "./src/screens/SignInScreen";
import HomeScreen from "./src/screens/HomeScreen";
import GroupsScreen from "./src/screens/GroupsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ClerkProviderWrapper>
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
      : "My Todos"
  })}
/>

          </Stack.Navigator>
        </SignedIn>
      </NavigationContainer>
    </ClerkProviderWrapper>
    
  );
}
