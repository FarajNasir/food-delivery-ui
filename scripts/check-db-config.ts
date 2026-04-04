import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function checkRLS() {
  console.log("🔍 Checking RLS policies and Replica Identity for 'orders' table...");
  
  try {
    // 1. Check RLS status
    const tableInfo = await sql`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
      WHERE relname = 'orders' AND nspname = 'public'
    `;
    console.log("📊 Table RLS status:", tableInfo);

    // 2. Check Policies
    const policies = await sql`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'orders'
    `;
    console.log("📜 Current Policies:", policies);

    // 3. Check Replica Identity
    const replicaIdentity = await sql`
      SELECT relreplident 
      FROM pg_class 
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
      WHERE relname = 'orders' AND nspname = 'public'
    `;
    // d = default, n = nothing, f = full, i = index
    console.log("🆔 Replica Identity (d=default, f=full):", replicaIdentity);

  } catch (err: any) {
    console.error("❌ Error checking database:", err.message);
  } finally {
    process.exit(0);
  }
}

checkRLS();
