import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";

  const data = await prisma.moodEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  if (format === "csv") {
    const headers = ["ID", "Score", "Tags", "Note", "Created At"];
    const rows = data.map((entry) =>
      [
        entry.id,
        entry.score,
        `"${(entry.tags || "").replace(/"/g, '""')}"`,
        `"${(entry.note || "").replace(/"/g, '""')}"`,
        entry.createdAt.toISOString(),
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=mood-data.csv",
      },
    });
  }

  return NextResponse.json(data, {
    headers: {
      "Content-Disposition": "attachment; filename=mood-data.json",
    },
  });
}
