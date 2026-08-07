// Startup environment validation utility
const requiredKeys = ["AUTH_SECRET", "AUTH_PASSWORD"];

// DATABASE_URL is strictly required when deploying to Vercel in production
if (process.env.NODE_ENV === "production" && process.env.VERCEL === "1") {
  requiredKeys.push("DATABASE_URL");
}

const missing: string[] = [];
for (const key of requiredKeys) {
  if (!process.env[key] || process.env[key].trim() === "") {
    missing.push(key);
  }
}

if (missing.length > 0) {
  const errorMessage = `
==================================================
CRITICAL BOOTSTRAP FAILURE: ENVIRONMENT MISCONFIGURED
==================================================
The application cannot start because the following required 
environment variables are missing or undefined:

${missing.map(k => ` - ${k}`).join("\n")}

Please define them in your environment or .env file and restart.
==================================================
`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const env = {
  authSecret: process.env.AUTH_SECRET!,
  authPassword: process.env.AUTH_PASSWORD!,
  databaseUrl: process.env.DATABASE_URL,
};
