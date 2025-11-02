import { getLocalTodos } from "./offline"; // 👈 add this
import NetInfo from "@react-native-community/netinfo";

export async function fetchTodos(userId) {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    console.log("🌐 Offline mode – loading todos from local DB");
    return await getLocalTodos(); // 👈 read from SQLite
  }

  try {
    const res = await fetch(`${API_BASE}/todos?userId=${userId}`);
    if (!res.ok) throw new Error("Server error");
    const data = await res.json();
    return data;
  } catch (err) {
    console.log("❌ Error fetching todos:", err);
    return await getLocalTodos(); // 👈 fallback to local even if fetch fails
  }
}
