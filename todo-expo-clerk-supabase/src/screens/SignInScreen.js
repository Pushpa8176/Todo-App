// src/screens/SignInScreen.js
import React, { useState } from "react";
import { Platform, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

let useSignIn;
if (Platform.OS === "web") {
  useSignIn = require("@clerk/clerk-react").useSignIn;
} else {
  useSignIn = require("@clerk/clerk-expo").useSignIn;
}

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigation = useNavigation();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        console.log("✅ Signed in successfully!");
      } else {
        console.log("🟡 Incomplete sign-in:", JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error("❌ Error signing in:", JSON.stringify(err, null, 2));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome - Sign In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={emailAddress}
        onChangeText={setEmailAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={onSignInPress}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 16 },
  title: { fontSize: 22, marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 10 },
  button: { backgroundColor: "purple", padding: 10, borderRadius: 8 },
  buttonText: { color: "white", textAlign: "center" },
});
