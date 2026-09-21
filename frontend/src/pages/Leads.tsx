import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Link } from "react-router-dom";
import { BellOff, Bell, Search } from "lucide-react";

export default function Leads() {
  const [q, setQ] = useState("");
  const [muted, setMuted] = useState<"" | "yes" | "no">("");
  const qc = useQueryClient();

  const leads = useQuery({
    queryKey: ["leads", q, muted],
    queryFn: () =>
      api.get("/api/leads", {
        params: { q: q || undefined, is_muted: muted === "yes" ? true : muted === "no" ? false : undefined },
      }).then((r) => r.data),
  });

  const toggleMute = useMutation({
    mutationFn: ({ id, isMuted }: { id: string; isMuted: boolean }) =>
      api.post(`/api/leads/${id}/${isMuted ? "unmute" : "mute"}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold mr-auto">Лиды ({leads.data?.total ?? 0})</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            className="input pl-9 w-64" placeholder="Поиск по имени / телефону / @"
            value={q} onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input w-40" value={muted} onChange={(e) => setMuted(e.target.value as any)}>
          <option value="">Все</option>
          <option value="yes">Только mute</option>
          <option value="no">Без mute</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="p-3">Профиль</th>
              <th className="p-3">Имя</th>
              <th className="p-3">Телефон</th>
              <th className="p-3">Город</th>
              <th className="p-3">Цель</th>
              <th className="p-3">Тариф</th>
              <th className="p-3">Mute</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(leads.data?.items || []).map((l: any) => {
              const isMuted = l.muted_until && new Date(l.muted_until) > new Date();
              return (
                <tr key={l.sender_id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="p-3">
                    <Link to={`/chats/${l.sender_id}`} className="text-sky-600 hover:underline">
                      @{l.ig_username || l.sender_id}
                    </Link>
                  </td>
                  <td className="p-3">{l.client_name || "—"}</td>
                  <td className="p-3">{l.phone || "—"}</td>
                  <td className="p-3">{l.city || "—"}</td>
                  <td className="p-3">{l.target_weight || "—"}</td>
                  <td className="p-3">{l.course || "—"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleMute.mutate({ id: l.sender_id, isMuted: !!isMuted })}
                      className="p-1 rounded hover:bg-slate-100"
                      title={isMuted ? "Включить бота" : "Отключить бота"}
                    >
                      {isMuted ? <BellOff size={16} className="text-red-500" /> : <Bell size={16} className="text-slate-400" />}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <Link to={`/chats/${l.sender_id}`} className="text-slate-500 hover:text-slate-900">Открыть →</Link>
                  </td>
                </tr>
              );
            })}
            {!leads.data?.items?.length && (
              <tr><td colSpan={8} className="p-6 text-center text-slate-400">Ничего не найдено</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}