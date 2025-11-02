// src/providers/ClerkProviderWrapper.js
import React from "react";
import Constants from "expo-constants"; 
import { Platform } from "react-native"; 

const publishableKey =
  Constants.expoConfig.extra?.CLERK_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

let ClerkProviderComponent;

// Dynamically import correct provider
if (Platform.OS === "web") {
  const { ClerkProvider } = require("@clerk/clerk-react"); //for web
  ClerkProviderComponent = ClerkProvider;
} else {
  const { ClerkProvider } = require("@clerk/clerk-expo");//for android or ios
  ClerkProviderComponent = ClerkProvider;
}

export default function ClerkProviderWrapper({ children }) {
  return (
    <ClerkProviderComponent publishableKey={publishableKey}>
      {children}
    </ClerkProviderComponent>
  );
}
 