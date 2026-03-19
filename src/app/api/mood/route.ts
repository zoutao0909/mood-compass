import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";

const moodSchema = z.object({
  score: z.number().int().min(1).max(10),
  tags: z.array(z.string().min(1)).default([]),
  note: z.string().max(500).optional().or(z.literal("")),
});

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    days: searchParams.get("days") || undefined,
  });

  const days = parsed.success ? parsed.data.days : undefined;
  const since = days ? startOfDay(subDays(new Date(), days)) : undefined;

  const data = await prisma.moodEntry.findMany({
    where: since ? { createdAt: { gte: since } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = moodSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.moodEntry.create({
    data: {
      score: parsed.data.score,
      tags: parsed.data.tags.join(","),
      note: parsed.data.note || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
