import "dotenv/config";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  try {
    console.log("=== CHECKING WEEKLY REVIEWS IN DB ===");
    const result = await pool.query("SELECT * FROM weekly_reviews ORDER BY id DESC LIMIT 5;");
    for (const row of result.rows) {
      console.log(`\nID: ${row.id}, Year: ${row.year}, Week: ${row.week_number}`);
      console.log("Report JSON:", JSON.stringify(JSON.parse(row.report_json), null, 2));
    }
  } catch (err) {
    console.error("Error querying weekly_reviews:", err);
  } finally {
    await pool.end();
  }
}

main();
