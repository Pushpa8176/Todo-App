import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";

// ✅ Platform-based Clerk import
let useUser;
if (Platform.OS === "web") {
  useUser = require("@clerk/clerk-react").useUser;
} else {
  useUser = require("@clerk/clerk-expo").useUser;
}

export default function TodoScreen({ route, navigation }) {
  const { user } = useUser();
  const [groupId, setGroupId] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [title, setTitle] = useState("");
  const [todos, setTodos] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  
const handleDateChange = (event, date) => {
  if (date) setSelectedDate(date);
  setShowDatePicker(false);
};
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [filter, setFilter] = useState("all");

  // ✅ Initialize group context (only if opened from a specific group)
  useEffect(() => {
    async function initializeGroup() {
      if (!user) return;

      if (route?.params?.groupId) {
        const { groupId, groupName } = route.params;
        await AsyncStorage.setItem("lastGroupId", groupId);
        await AsyncStorage.setItem("lastGroupName", groupName || "My Group");
        setGroupId(groupId);
        setGroupName(groupName || "My Group");
        console.log("✅ Opened Todos for Group:", groupName);
      } else {
        // No specific group selected → view all groups
        setGroupId(null);
        setGroupName("All Groups");
        console.log("📋 Showing todos from all groups");
      }
      await supabase.from("todos").insert([
  {
    title,
    is_complete: false,
    group_id: groupId,
    due_date: selectedDate, // 👈 store as string
  },
]);

    }
    

    initializeGroup();
  }, [user, route?.params]);

  // ✅ Fetch all todos or group-specific todos
  async function fetchTodos(currentFilter = filter) {
    if (!user) return;

    let query = supabase
      .from("todos")
      .select("*, groups(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // If user navigated from a specific group, filter by it
    if (groupId) {
      query = query.eq("group_id", groupId);
    }

    // Apply filters
    if (currentFilter === "active") query = query.eq("is_completed", false);
    if (currentFilter === "completed") query = query.eq("is_completed", true);

    const { data, error } = await query;
    if (!error) setTodos(data);
    else console.error("❌ Error fetching todos:", error);
  }

  useEffect(() => {
    fetchTodos();
  }, [groupId, filter]);

  // ✅ Add new todo (only when groupId is known)
  async function addTodo() {
    if (!title.trim() || !user) return;

    // If no specific group selected, use Default Group
    let activeGroupId = groupId;

    if (!activeGroupId) {
      // Fetch or create default group
      const { data: existingGroup } = await supabase
        .from("groups")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", "Default Group")
        .maybeSingle();

      if (existingGroup) {
        activeGroupId = existingGroup.id;
      } else {
        const { data: newGroup } = await supabase
          .from("groups")
          .insert([{ user_id: user.id, name: "Default Group" }])
          .select()
          .single();
        activeGroupId = newGroup.id;
      }
    }

    const { error } = await supabase.from("todos").insert([
      {
        user_id: user.id,
        title,
        group_id: activeGroupId,
        is_completed: false,
        due_date: selectedDate || null,
        priority: selectedPriority,
      },
    ]);

    if (!error) {
      setTitle("");
      fetchTodos();
    }
  }

  async function toggleTodoStatus(id, currentStatus) {
    const { error } = await supabase
      .from("todos")
      .update({ is_completed: !currentStatus })
      .eq("id", id);
    if (!error) fetchTodos();
  }

  async function deleteTodo(id) {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (!error) fetchTodos();
  }

  async function saveEdit(id) {
    if (!editTitle.trim()) return;
    const { error } = await supabase.from("todos").update({ title: editTitle }).eq("id", id);
    if (!error) {
      setEditingId(null);
      setEditTitle("");
      fetchTodos();
    }
  }

  // ✅ Realtime updates (for all todos if groupId is null)
  useEffect(() => {
    const channel = supabase
      .channel("todos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        () => fetchTodos()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ✅ UI
  return (
    <View style={{ padding: 20, flex: 1 }}>
      {/* ✅ Show Back to Groups only when viewing All Groups (not specific group) */}
{!groupId && (
  <TouchableOpacity onPress={() => navigation.navigate("Groups")}>
    <Text style={{ color: "blue", marginBottom: 10 }}>⬅ Back to Groups</Text>
  </TouchableOpacity>
)}

      <Text style={{ fontSize: 22, marginBottom: 10 }}>📝 Todos - {groupName}</Text>

      {/* Input field */}
      <TextInput
        placeholder="Enter a task"
        value={title}
        onChangeText={setTitle}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 8,
          borderRadius: 6,
          marginBottom: 10,
        }}
      />
      
      {/* Priority Selector */}
<View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 10 }}>
  {["low", "medium", "high"].map((level) => (
    <TouchableOpacity
      key={level}
      onPress={() => setSelectedPriority(level)}
      style={{
        backgroundColor: selectedPriority === level ? "purple" : "#ddd",
        padding: 8,
        borderRadius: 6,
        width: 90,
      }}
    >
      <Text
        style={{
          color: selectedPriority === level ? "white" : "black",
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        {level.toUpperCase()}
      </Text>
    </TouchableOpacity>
  ))}
</View>

{/* 📅 Enter Due Date Manually */}
<View style={{ marginBottom: 10 }}>
  <Text style={{ fontWeight: "600", marginBottom: 5 }}>📅 Due Date</Text>

  <TextInput
    placeholder="Enter date (dd-mm-yyyy)"
    value={selectedDate}
    onChangeText={(text) => {
      // Remove non-digits
      let formatted = text.replace(/[^\d]/g, "");

      // Auto-insert hyphens as user types
      if (formatted.length > 2 && formatted.length <= 4)
        formatted = formatted.slice(0, 2) + "-" + formatted.slice(2);
      else if (formatted.length > 4)
        formatted = formatted.slice(0, 2) + "-" + formatted.slice(2, 4) + "-" + formatted.slice(4, 8);

      setSelectedDate(formatted);
    }}
    keyboardType="numeric"
    maxLength={10}
    style={{
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 8,
      padding: 10,
      width: "100%",
    }}
  />
</View>


      <TouchableOpacity
        onPress={addTodo}
        disabled={!title.trim()}
        style={{
          backgroundColor: title.trim() ? "purple" : "gray",
          padding: 10,
          borderRadius: 8,
          marginBottom: 10,
        }}
      >

        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>➕ Add Todo</Text>
      </TouchableOpacity>

      {/* Filter Buttons */}
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
        {["all", "active", "completed"].map((btn) => (
          <TouchableOpacity
            key={btn}
            onPress={() => setFilter(btn)}
            style={{
              backgroundColor: filter === btn ? "purple" : "#ddd",
              padding: 8,
              borderRadius: 6,
              width: 100,
            }}
          >
            <Text
              style={{
                color: filter === btn ? "white" : "black",
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              {btn.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Todo List */}
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
            }}
          >
            {editingId === item.id ? (
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                onSubmitEditing={() => saveEdit(item.id)}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  padding: 6,
                  borderRadius: 6,
                  flex: 1,
                  marginRight: 8,
                }}
              />
            ) : (
              <TouchableOpacity
                onPress={() => toggleTodoStatus(item.id, item.is_completed)}
                style={{ flex: 1 }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    textDecorationLine: item.is_completed ? "line-through" : "none",
                  }}
                >
                  {item.is_completed ? "✅" : "⬜"} {item.title}
                </Text>
                <Text style={{ fontSize: 14, color: "#555" }}>
                  🏷️ Group: {item.groups?.name || "Unknown"} | 🗓️{" "}
                  {item.due_date || "No date"} | ⚡ {item.priority || "medium"}
                </Text>
              </TouchableOpacity>
            )}

            {editingId === item.id ? (
              <TouchableOpacity onPress={() => saveEdit(item.id)}>
                <Text style={{ color: "green", marginRight: 8 }}>💾</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setEditingId(item.id);
                  setEditTitle(item.title);
                }}
              >
                <Text style={{ color: "blue", marginRight: 8 }}>✏️</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
              <Text style={{ color: "red" }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
