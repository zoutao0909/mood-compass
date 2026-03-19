import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authCookieName, verifySessionToken } from "@/lib/auth";

const moodSchema = z.object({
  score: z.number().int().min(1).max(10),
  tags: z.array(z.string().min(1)).default([]),
  note: z.string().max(500).optional().or(z.literal("")),
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = moodSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.moodEntry.updateMany({
    where: { id: Number(id), userId },
    data: {
      score: parsed.data.score,
      tags: parsed.data.tags.join(","),
      note: parsed.data.note || null,
    },
  });

  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = await prisma.moodEntry.findUnique({ where: { id: Number(id) } });
  return NextResponse.json(row);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deleted = await prisma.moodEntry.deleteMany({ where: { id: Number(id), userId } });
  if (deleted.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
