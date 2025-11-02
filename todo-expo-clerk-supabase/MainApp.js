import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

export default function AppLoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 Todo App</Text>
      <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      <Text style={styles.subtitle}>Loading your data...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },
  loader: {
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 10,
  },
});
