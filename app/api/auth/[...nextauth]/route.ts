import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

async function authHandler(req: NextRequest, context: any) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  process.env.NEXTAUTH_URL = baseUrl;
  process.env.AUTH_URL = baseUrl;
  return handler(req, context);
}

export { authHandler as GET, authHandler as POST };
