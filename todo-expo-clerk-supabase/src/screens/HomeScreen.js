// src/screens/HomeScreen.js
import React from "react";
import { Platform, View, Text, Button, TouchableOpacity, StyleSheet } from "react-native";


let useClerk;
if (Platform.OS === "web") {
  useClerk = require("@clerk/clerk-react").useClerk;
} else {
  useClerk = require("@clerk/clerk-expo").useClerk;
}

export default function HomeScreen({ navigation }) {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log("✅ Signed out successfully!");
    } catch (err) {
      console.error("❌ Error signing out:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Home Screen 🎉</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
      
      <Button title="Go to Todos" onPress={() => navigation.navigate("Todos")} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, marginBottom: 20 },
  button: { backgroundColor: "purple", padding: 10, borderRadius: 8 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "600" },
});
