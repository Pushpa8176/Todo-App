import React from "react";
import { Platform } from "react-native";
import { ClerkProvider as ClerkWebProvider } from "@clerk/clerk-react";
import { ClerkProvider as ClerkExpoProvider } from "@clerk/clerk-expo";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function UniversalClerkProvider({ children }) {
  if (!publishableKey) {
    console.error("❌ Missing Clerk publishable key!");
    return children;
  }

  if (Platform.OS === "web") {
    console.log("✅ Using Clerk Web Provider");
    return (
      <ClerkWebProvider publishableKey={publishableKey}>
        {children}
      </ClerkWebProvider>
    );
  }

  console.log("✅ Using Clerk Expo Provider");
  return (
    <ClerkExpoProvider publishableKey={publishableKey}>
      {children}
    </ClerkExpoProvider>
  );
}
