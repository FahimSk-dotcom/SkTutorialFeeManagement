// @ts-ignore
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getDb } from "./mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "sk_tutorials_super_secret_jwt_key_2026";
const COOKIE_NAME = "admin_token";

export interface TokenPayload {
  adminId: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function signJwtToken(payload: TokenPayload, rememberMe: boolean = false): string {
  const expiresIn = rememberMe ? "30d" : "1d";
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwtToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function setAdminCookie(token: string, rememberMe: boolean = false) {
  const cookieStore = await cookies();
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function removeAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthenticatedAdmin(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyJwtToken(token);
  } catch (error) {
    return null;
  }
}

export async function ensureDefaultAdmin() {
  const db = await getDb();
  const existingAdmin = await db.collection("admins").findOne({});
  if (!existingAdmin) {
    const defaultEmail = process.env.ADMIN_EMAIL || "admin@sktutorials.com";
    const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
    const passwordHash = await hashPassword(defaultPassword);

    await db.collection("admins").insertOne({
      email: defaultEmail.toLowerCase(),
      passwordHash,
      name: "SK Admin",
      createdAt: new Date(),
    });
    console.log(`Default admin created: ${defaultEmail}`);
  }
}
