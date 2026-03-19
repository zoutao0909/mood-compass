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

type Me = { id: number; email: string; name?: string | null };

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authLoading, setAuthLoading] = useState(false);

  const [score, setScore] = useState(6);
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysFilter, setDaysFilter] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchMe = async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) {
      setMe(null);
      return;
    }
    const json = await res.json();
    setMe(json.data);
  };

  const fetchItems = async () => {
    if (!me) return;
    const url = daysFilter ? `/api/mood?days=${daysFilter}` : "/api/mood";
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [daysFilter, me]);

  const onAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setAuthLoading(false);
    if (res.ok) {
      setPassword("");
      await fetchMe();
      await fetchItems();
    } else {
      alert("认证失败，请检查邮箱/密码");
    }
  };

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    setItems([]);
  };

  const chartData = useMemo(
    () => [...items].reverse().map((i) => ({ date: format(new Date(i.createdAt), "MM-dd"), score: i.score })),
    [items]
  );

  const tagStats = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      if (!item.tags) return;
      item.tags.split(",").forEach((tag) => {
        const t = tag.trim();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [items]);

  const lowScoreWarning = useMemo(() => {
    if (items.length < 3) return null;
    const recent3 = items.slice(0, 3);
    return recent3.every((i) => i.score <= 4) ? "⚠️ 连续3天心情较低，建议关注休息与调节。" : null;
  }, [items]);

  const averageScore = useMemo(() => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + item.score, 0);
    return (sum / items.length).toFixed(1);
  }, [items]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingId) {
      await fetch(`/api/mood/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), note }),
      });
      setEditingId(null);
    } else {
      await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), note }),
      });
    }

    setTags("");
    setNote("");
    setScore(6);
    setShowForm(false);
    await fetchItems();
    setLoading(false);
  };

  const onEdit = (item: MoodEntry) => {
    setEditingId(item.id);
    setScore(item.score);
    setTags(item.tags || "");
    setNote(item.note || "");
    setShowForm(true);
  };

  const onDelete = async (id: number) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await fetch(`/api/mood/${id}`, { method: "DELETE" });
    await fetchItems();
  };

  const onExport = (format: "json" | "csv") => {
    window.open(`/api/export?format=${format}`, "_blank");
  };

  if (!me) {
    return (
      <main className="mx-auto max-w-md p-6 md:p-10">
        <h1 className="text-2xl font-bold">Mood Compass</h1>
        <p className="mt-2 text-sm text-gray-600">请先登录后使用。</p>
        <form onSubmit={onAuthSubmit} className="mt-6 grid gap-3 rounded-xl border p-4">
          <input className="rounded border px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="rounded border px-3 py-2" placeholder="Password (>=6)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="rounded bg-black px-4 py-2 text-white" disabled={authLoading}>
            {authLoading ? "处理中..." : authMode === "login" ? "登录" : "注册"}
          </button>
          <button type="button" className="text-sm text-blue-600" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
            {authMode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-4 md:p-6 lg:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mood Compass</h1>
          <p className="mt-1 text-sm text-gray-600">已登录：{me.email}</p>
        </div>
        <button onClick={onLogout} className="rounded-lg border px-3 py-2 text-sm">退出登录</button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-3 md:p-4"><div className="text-xs text-gray-600">总记录</div><div className="mt-1 text-xl md:text-2xl font-bold">{items.length}</div></div>
        <div className="rounded-lg border bg-white p-3 md:p-4"><div className="text-xs text-gray-600">平均分</div><div className="mt-1 text-xl md:text-2xl font-bold">{averageScore}</div></div>
        <div className="rounded-lg border bg-white p-3 md:p-4"><div className="text-xs text-gray-600">最高分</div><div className="mt-1 text-xl md:text-2xl font-bold text-green-600">{items.length > 0 ? Math.max(...items.map((i) => i.score)) : "-"}</div></div>
        <div className="rounded-lg border bg-white p-3 md:p-4"><div className="text-xs text-gray-600">最低分</div><div className="mt-1 text-xl md:text-2xl font-bold text-red-600">{items.length > 0 ? Math.min(...items.map((i) => i.score)) : "-"}</div></div>
      </div>

      {lowScoreWarning && <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">{lowScoreWarning}</div>}

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => { setShowForm(!showForm); if (!showForm) { setEditingId(null); setScore(6); setTags(""); setNote(""); } }} className="rounded-lg bg-black px-4 py-2 text-sm md:text-base text-white">
          {showForm ? "取消" : "+ 新增记录"}
        </button>
        <button onClick={() => onExport("json")} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">导出 JSON</button>
        <button onClick={() => onExport("csv")} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">导出 CSV</button>
      </div>

      {showForm && (
        <section className="mb-6 rounded-xl border bg-white p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold">{editingId ? "编辑记录" : "新增记录"}</h2>
          <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:gap-4">
            <label className="grid gap-1"><span className="text-xs md:text-sm text-gray-700">心情分数 (1-10)</span><div className="flex items-center gap-3"><input type="range" min={1} max={10} value={score} onChange={(e) => setScore(Number(e.target.value))} className="flex-1" /><span className="w-8 text-center text-lg font-bold">{score}</span></div></label>
            <label className="grid gap-1"><span className="text-xs md:text-sm text-gray-700">标签（逗号分隔）</span><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="工作, 睡眠, 运动" className="rounded-lg border px-3 py-2 text-sm md:text-base" /></label>
            <label className="grid gap-1"><span className="text-xs md:text-sm text-gray-700">备注</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="今天怎么样..." className="rounded-lg border px-3 py-2 text-sm md:text-base" /></label>
            <div className="flex gap-2"><button disabled={loading} className="rounded-lg bg-black px-4 py-2 text-sm md:text-base text-white disabled:opacity-50" type="submit">{loading ? "保存中..." : editingId ? "更新" : "保存"}</button></div>
          </form>
        </section>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setDaysFilter(null)} className={`rounded-lg px-3 py-1.5 text-xs md:text-sm ${daysFilter === null ? "bg-black text-white" : "border bg-white"}`}>全部</button>
        <button onClick={() => setDaysFilter(7)} className={`rounded-lg px-3 py-1.5 text-xs md:text-sm ${daysFilter === 7 ? "bg-black text-white" : "border bg-white"}`}>7天</button>
        <button onClick={() => setDaysFilter(30)} className={`rounded-lg px-3 py-1.5 text-xs md:text-sm ${daysFilter === 30 ? "bg-black text-white" : "border bg-white"}`}>30天</button>
      </div>

      <section className="mb-6 rounded-xl border bg-white p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold">心情趋势</h2>
        <div className="mt-4 h-48 md:h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis domain={[1, 10]} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ fontSize: 12 }} labelStyle={{ fontSize: 12 }} /><Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
          ) : <div className="flex h-full items-center justify-center text-gray-400">暂无数据</div>}
        </div>
      </section>

      {tagStats.length > 0 && <section className="mb-6 rounded-xl border bg-white p-4 md:p-6"><h2 className="text-lg md:text-xl font-semibold">高频标签</h2><div className="mt-4 grid gap-2">{tagStats.map(([tag, count]) => <div key={tag} className="flex items-center justify-between rounded-lg border p-2 md:p-3"><span className="font-medium text-sm md:text-base">{tag}</span><span className="text-xs md:text-sm text-gray-600">{count} 次</span></div>)}</div></section>}

      <section className="rounded-xl border bg-white p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold">最近记录</h2>
        <div className="mt-4 grid gap-3">
          {items.map((i) => (
            <div key={i.id} className="rounded-lg border p-3 transition hover:border-gray-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i.score >= 7 ? "bg-green-100 text-green-700" : i.score >= 4 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{i.score}</div><span className="text-xs md:text-sm text-gray-500">{format(new Date(i.createdAt), "MM-dd HH:mm")}</span></div>
                  {i.tags && <div className="mt-2 flex flex-wrap gap-1">{i.tags.split(",").map((tag, idx) => <span key={idx} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{tag.trim()}</span>)}</div>}
                  {i.note && <p className="mt-2 text-xs md:text-sm text-gray-700 line-clamp-2">{i.note}</p>}
                </div>
                <div className="flex flex-shrink-0 gap-1"><button onClick={() => onEdit(i)} className="rounded px-2 py-1 text-xs hover:bg-gray-100">编辑</button><button onClick={() => onDelete(i.id)} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">删除</button></div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="py-8 text-center text-sm text-gray-400">还没有记录，点击"新增记录"开始追踪你的心情吧</div>}
        </div>
      </section>
    </main>
  );
}
