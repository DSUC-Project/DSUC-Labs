import { mockDb } from "./mockDb";
import { USE_MOCK_DB } from "./config/runtime";

let supabaseClient: any = null;

if (!USE_MOCK_DB) {
  const { createClient } =
    require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  supabaseClient = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "",
  );
}

export const supabase = supabaseClient;
export const db = (USE_MOCK_DB ? mockDb : supabase) as any;
