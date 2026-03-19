import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const moodSchema = z.object({
  score: z.number().int().min(1).max(10),
  tags: z.array(z.string().min(1)).default([]),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const json = await req.json();
  const parsed = moodSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.moodEntry.update({
    where: { id: Number(id) },
    data: {
      score: parsed.data.score,
      tags: parsed.data.tags.join(","),
      note: parsed.data.note || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.moodEntry.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ success: true });
}
