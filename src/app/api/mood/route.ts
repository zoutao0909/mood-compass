import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";
import { authCookieName, verifySessionToken } from "@/lib/auth";

const moodSchema = z.object({
  score: z.number().int().min(1).max(10),
  tags: z.array(z.string().min(1)).default([]),
  note: z.string().max(500).optional().or(z.literal("")),
});

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

async function getUserId(req: Request): Promise<number | null> {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${authCookieName}=`))
    ?.split("=")[1];
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  return Number(payload.sub);
}

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ days: searchParams.get("days") || undefined });
  const days = parsed.success ? parsed.data.days : undefined;
  const since = days ? startOfDay(subDays(new Date(), days)) : undefined;

  const data = await prisma.moodEntry.findMany({
    where: { userId, ...(since ? { createdAt: { gte: since } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = moodSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const created = await prisma.moodEntry.create({
    data: {
      score: parsed.data.score,
      tags: parsed.data.tags.join(","),
      note: parsed.data.note || null,
      userId,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
