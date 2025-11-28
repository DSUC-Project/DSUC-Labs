import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log("Seeding DB...");

  // members with explicit student IDs
  const members = [
    {
      id: "20210001",
      name: "Member 01",
      role: "Member",
      wallet_address: "WalletAddr1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210002",
      name: "Member 02",
      role: "Member",
      wallet_address: "WalletAddr2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210003",
      name: "Member 03",
      role: "Member",
      wallet_address: "WalletAddr3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210004",
      name: "Member 04",
      role: "Member",
      wallet_address: "WalletAddr4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210005",
      name: "Member 05",
      role: "Member",
      wallet_address: "WalletAddr5xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210006",
      name: "Member 06",
      role: "Member",
      wallet_address: "WalletAddr6xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210007",
      name: "Member 07",
      role: "Member",
      wallet_address: "WalletAddr7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210008",
      name: "Member 08",
      role: "Member",
      wallet_address: "WalletAddr8xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210009",
      name: "Member 09",
      role: "Member",
      wallet_address: "WalletAddr9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210010",
      name: "Member 10",
      role: "Member",
      wallet_address: "WalletAddr10xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210011",
      name: "Member 11",
      role: "Member",
      wallet_address: "WalletAddr11xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210012",
      name: "Member 12",
      role: "Member",
      wallet_address: "WalletAddr12xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210013",
      name: "Member 13",
      role: "Member",
      wallet_address: "WalletAddr13xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210014",
      name: "Member 14",
      role: "Member",
      wallet_address: "WalletAddr14xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      id: "20210015",
      name: "Member 15",
      role: "Member",
      wallet_address: "WalletAddr15xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
  ];

  // insert members (use upsert to avoid duplicates)
  const { error: membersError } = await supabase
    .from("members")
    .upsert(members);
  if (membersError) {
    console.error("Error inserting members", membersError);
  } else {
    console.log("Members seeded");
  }

  // projects (builders as student IDs)
  const { error: projectsError } = await supabase.from("projects").upsert([
    {
      name: "ZAH Wallet",
      description: "On-chain wallet for students",
      category: "Wallet",
      builders: ["20210001", "20210002"],
      link: "",
      repo_link: "",
    },
  ]);
  if (projectsError) console.error("Error inserting projects", projectsError);

  // events
  const { error: eventsError } = await supabase.from("events").upsert([
    {
      title: "Hackathon Kickoff",
      date: "2025-12-01",
      time: "18:00",
      location: "Auditorium",
    },
  ]);
  if (eventsError) console.error("Error inserting events", eventsError);

  // bounties
  const { error: bountiesError } = await supabase.from("bounties").upsert([
    {
      title: "Implement auth",
      reward: "200",
      difficulty: "Medium",
      tags: ["backend", "auth"],
    },
  ]);
  if (bountiesError) console.error("Error inserting bounties", bountiesError);

  // repos
  const { error: reposError } = await supabase.from("repos").upsert([
    {
      name: "dsuc-website",
      description: "Club website",
      language: "TypeScript",
      stars: 10,
    },
  ]);
  if (reposError) console.error("Error inserting repos", reposError);

  // resources
  const { error: resourcesError } = await supabase.from("resources").upsert([
    {
      name: "Intro to Solana",
      type: "pdf",
      url: "https://drive.google.com/example",
      size: "2MB",
      category: "Learning",
    },
  ]);
  if (resourcesError)
    console.error("Error inserting resources", resourcesError);

  console.log("Seeding finished");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
