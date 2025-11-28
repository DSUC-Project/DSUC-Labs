import { supabase } from "./index";

async function run() {
  console.log("Migration runner: check Supabase connection");
  try {
    const { data, error } = await supabase.rpc("pg_version");
    console.log({ data, error });
  } catch (err) {
    console.error("Migration error", err);
  }
}

run().catch(console.error);
