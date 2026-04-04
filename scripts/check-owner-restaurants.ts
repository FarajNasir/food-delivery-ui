import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function checkOwnerRestaurants() {
  console.log("🕵️ Checking restaurants for the owner...");
  
  try {
    // 1. Get the current owner (assuming the one the user is using)
    const owners = await sql`SELECT id, name, email FROM users WHERE role = 'owner'`;
    console.log("👤 Owners found:", owners);

    if (owners.length > 0) {
      for (const owner of owners) {
        const owned = await sql`SELECT id, name FROM restaurants WHERE owner_id = ${owner.id}`;
        console.log(`🏠 Restaurants for owner ${owner.email}:`, owned);
      }
    }

  } catch (err: any) {
    console.error("❌ Error checking restaurants:", err.message);
  } finally {
    process.exit(0);
  }
}

checkOwnerRestaurants();
