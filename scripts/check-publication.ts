import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function checkPublication() {
  console.log("🕵️ Checking Supabase Realtime Publication details...");
  
  try {
    // 1. List publication tables 
    const tables = await sql`
      SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
    `;
    console.log("📑 Tables in 'supabase_realtime':", tables);

    // 2. Check if the table is actually 'orders' (case sensitivity check)
    const exactTables = await sql`
      SELECT * FROM pg_publication_tables WHERE tablename ilike 'orders'
    `;
    console.log("🎯 Tables similar to 'orders' in any publication:", exactTables);

    // 3. Check publication owner
    const pub = await sql`
      SELECT pubname, pubowner, puballtables, pubinsert, pubupdate, pubdelete 
      FROM pg_publication 
      WHERE pubname = 'supabase_realtime'
    `;
    console.log("📡 Publication flags:", pub);

  } catch (err: any) {
    console.error("❌ Error checking publication:", err.message);
  } finally {
    process.exit(0);
  }
}

checkPublication();
