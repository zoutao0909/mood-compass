"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";

type MoodEntry = {
  id: number;
  score: number;
  tags: string;
  note: string | null;
  createdAt: string;
};

export default function Home() {
  const [score, setScore] = useState(6);
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysFilter, setDaysFilter] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchItems = async () => {
    const url = daysFilter ? `/api/mood?days=${daysFilter}` : "/api/mood";
    const res = await fetch(url);
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, [daysFilter]);

  const chartData = useMemo(
    () =>
      [...items]
        .reverse()
        .map((i) => ({
          date: format(new Date(i.createdAt), "MM-dd"),
          score: i.score,
        })),
    [items]
  );

  // 标签统计
  const tagStats = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      if (!item.tags) return;
      item.tags.split(",").forEach((tag) => {
        const t = tag.trim();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [items]);

  // 连续低分提醒（连续3天 <= 4）
  const lowScoreWarning = useMemo(() => {
    if (items.length < 3) return null;
    const recent3 = items.slice(0, 3);
    if (recent3.every((i) => i.score <= 4)) {
      return "⚠️ 连续3天心情较低，建议关注休息与调节。";
    }
    return null;
  }, [items]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      await fetch(`/api/mood/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          note,
        }),
      });
      setEditingId(null);
    } else {
      await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          note,
        }),
      });
    }

    setTags("");
    setNote("");
    setScore(6);
    await fetchItems();
    setLoading(false);
  };

  const onEdit = (item: MoodEntry) => {
    setEditingId(item.id);
    setScore(item.score);
    setTags(item.tags || "");
    setNote(item.note || "");
  };

  const onDelete = async (id: number) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await fetch(`/api/mood/${id}`, { method: "DELETE" });
    await fetchItems();
  };

  return (
    <main className="mx-auto max-w-4xl p-6 md:p-10">
      <h1 className="text-3xl font-bold">Mood Compass</h1>
      <p className="mt-2 text-sm text-gray-600">Track your daily mood and spot trends.</p>

      {lowScoreWarning && (
        <div className="mt-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          {lowScoreWarning}
        </div>
      )}

      <section className="mt-8 rounded-xl border p-4 md:p-6">
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Entry" : "Add Entry"}
        </h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm">Mood score (1-10)</span>
            <input
              type="number"
              min={1}
              max={10}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="rounded border px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Tags (comma separated)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, sleep, exercise"
              className="rounded border px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="rounded border px-3 py-2"
            />
          </label>

          <div className="flex gap-2">
            <button
              disabled={loading}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
              type="submit"
            >
              {loading ? "Saving..." : editingId ? "Update" : "Save"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setScore(6);
                  setTags("");
                  setNote("");
                }}
                className="rounded border px-4 py-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mt-8 flex flex-wrap gap-2">
        <button
          onClick={() => setDaysFilter(null)}
          className={`rounded px-3 py-1.5 text-sm ${
            daysFilter === null ? "bg-black text-white" : "border"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setDaysFilter(7)}
          className={`rounded px-3 py-1.5 text-sm ${
            daysFilter === 7 ? "bg-black text-white" : "border"
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => setDaysFilter(30)}
          className={`rounded px-3 py-1.5 text-sm ${
            daysFilter === 30 ? "bg-black text-white" : "border"
          }`}
        >
          30 Days
        </button>
      </section>

      <section className="mt-8 rounded-xl border p-4 md:p-6">
        <h2 className="text-xl font-semibold">Mood Trend</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[1, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {tagStats.length > 0 && (
        <section className="mt-8 rounded-xl border p-4 md:p-6">
          <h2 className="text-xl font-semibold">Top Triggers</h2>
          <ul className="mt-4 grid gap-2">
            {tagStats.map(([tag, count]) => (
              <li key={tag} className="flex items-center justify-between rounded border p-2">
                <span className="font-medium">{tag}</span>
                <span className="text-sm text-gray-600">{count} 次</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 rounded-xl border p-4 md:p-6">
        <h2 className="text-xl font-semibold">Recent Entries</h2>
        <ul className="mt-4 grid gap-3">
          {items.map((i) => (
            <li key={i.id} className="rounded border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong>Score: {i.score}</strong>
                    <span className="text-xs text-gray-500">
                      {format(new Date(i.createdAt), "yyyy-MM-dd HH:mm")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">Tags: {i.tags || "-"}</p>
                  {i.note ? <p className="mt-1 text-sm">{i.note}</p> : null}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(i)}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(i.id)}
                    className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
          {items.length === 0 ? <li className="text-sm text-gray-500">No entries yet.</li> : null}
        </ul>
      </section>
    </main>
  );
}
