import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || {};
const SUPABASE_URL = extra.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = extra.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Log to check
console.log("🧩 SUPABASE_URL =", SUPABASE_URL);
console.log("🧩 SUPABASE_KEY =", SUPABASE_KEY ? "Loaded ✅" : "Missing ❌");

if (!SUPABASE_URL?.startsWith("http")) {
  throw new Error("❌ Invalid Supabase URL — must start with http or https");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
