import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { supabase } from "../lib/supabase";

export default function TestSupabaseScreen() {
  const [todos, setTodos] = useState([]);

  const fetchTodos = async () => {
    const { data, error } = await supabase.from("todos").select("*");
    if (error) console.error("❌ Fetch error:", error);
    else setTodos(data);
  };

  const insertTodo = async () => {
    const { data, error } = await supabase.from("todos").insert([
      { title: "Test Task", is_completed: false },
    ]);
    if (error) console.error("❌ Insert error:", error);
    else console.log("✅ Inserted:", data);
    fetchTodos();
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Add Test Todo" onPress={insertTodo} />
      <Text>Fetched Todos:</Text>
      {todos.map((t) => (
        <Text key={t.id}>{t.title}</Text>
      ))}
    </View>
  );
}
