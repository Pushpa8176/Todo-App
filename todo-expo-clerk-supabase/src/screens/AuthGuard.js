import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import SignInScreen from "./SignInScreen";

export default function AuthGuard({ children }) {
  const { isLoaded, session } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <SignInScreen />;
  }

  return children;
}
