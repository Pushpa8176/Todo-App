import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Platform } from "react-native";
import { supabase } from "../lib/supabase";

let useUser;
if (Platform.OS === "web") {
  useUser = require("@clerk/clerk-react").useUser;
} else {
  useUser = require("@clerk/clerk-expo").useUser;
}

export default function GroupsScreen({ navigation }) { // ✅ use plural naming consistently
  const { user } = useUser();
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState([]);

  // ✅ Fetch groups for current user
  async function fetchGroups() {
    if (!user) return;
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setGroups(data);
    else console.error("❌ Error fetching groups:", error);
  }

  // ✅ Add a new group
  async function addGroup() {
    if (!groupName.trim() || !user) return;
    const { error } = await supabase
      .from("groups")
      .insert([{ user_id: user.id, name: groupName.trim() }]);
    if (!error) {
      setGroupName("");
      fetchGroups();
    } else {
      console.error("❌ Error adding group:", error);
    }
  }

  // ✅ Delete group
  async function deleteGroup(id) {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (!error) fetchGroups();
    else console.error("❌ Error deleting group:", error);
  }

  // ✅ Fetch on mount and enable real-time updates
  useEffect(() => {
    if (!user) return;
    fetchGroups();

    const channel = supabase
      .channel("groups-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        () => fetchGroups()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 10 }}>📂 Task Groups</Text>

      {/* ✅ Group input */}
      <TextInput
        placeholder="Enter new group name"
        value={groupName}
        onChangeText={setGroupName}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 8,
          marginBottom: 10,
          borderRadius: 6,
        }}
      />

      <TouchableOpacity
        style={{
          backgroundColor: groupName.trim() ? "purple" : "gray",
          padding: 10,
          borderRadius: 8,
          marginBottom: 20,
        }}
        disabled={!groupName.trim()}
        onPress={addGroup}
      >
        <Text style={{ color: "white", textAlign: "center" }}>➕ Add Group</Text>
      </TouchableOpacity>

      {/* ✅ Group list */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
            }}
          >
            {/* ✅ Navigate to Todos screen and pass groupId & groupName */}
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => {
  console.log("🟢 Navigating with:", item.id, item.name);
  navigation.navigate("Todos", { groupId: item.id, groupName: item.name });
}}

            >
              <Text style={{ fontSize: 18 }}>📁 {item.name}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteGroup(item.id)}>
              <Text style={{ color: "red" }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
