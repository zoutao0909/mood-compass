import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "mc_session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "mood-compass-dev-secret-change-me"
);

export type SessionPayload = {
  sub: string;
  email: string;
};

export const authCookieName = COOKIE_NAME;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { sub: String(payload.sub), email: String(payload.email) };
  } catch {
    return null;
  }
}
