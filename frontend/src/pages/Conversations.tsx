import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { format } from "date-fns";
import { Send, BellOff, Bell } from "lucide-react";

export default function Conversations() {
  const { senderId } = useParams();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const list = useQuery({
    queryKey: ["conv-list"],
    queryFn: () => api.get("/api/conversations").then((r) => r.data),
    refetchInterval: 15000,
  });

  const lead = useQuery({
    queryKey: ["lead", senderId],
    queryFn: () => senderId ? api.get(`/api/leads/${senderId}`).then((r) => r.data) : null,
    enabled: !!senderId,
  });

  const messages = useQuery({
    queryKey: ["messages", senderId],
    queryFn: () => senderId ? api.get(`/api/conversations/${senderId}/messages`).then((r) => r.data) : [],
    enabled: !!senderId,
    refetchInterval: 5000,
  });

  const send = useMutation({
    mutationFn: (text: string) => api.post(`/api/conversations/${senderId}/send`, { text }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["messages", senderId] });
    },
  });

  const mute = useMutation({
    mutationFn: (on: boolean) => api.post(`/api/leads/${senderId}/${on ? "mute" : "unmute"}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", senderId] }),
  });

  const isMuted = lead.data?.muted_until && new Date(lead.data.muted_until) > new Date();

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r bg-white overflow-y-auto">
        <div className="p-4 border-b font-semibold">Диалоги</div>
        {list.data?.map((c: any) => (
          <Link
            key={c.session_id}
            to={`/chats/${c.session_id}`}
            className={`block p-3 border-b hover:bg-slate-50 ${senderId === c.session_id ? "bg-sky-50" : ""}`}
          >
            <div className="text-sm font-medium">
              {c.client_name || c.ig_username || c.session_id}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {typeof c.message === "object" ? c.message?.content : ""}
            </div>
          </Link>
        ))}
      </div>

      <div className="flex-1 flex flex-col bg-slate-50">
        {!senderId && (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Выберите диалог
          </div>
        )}
        {senderId && (
          <>
            <header className="p-4 bg-white border-b flex items-center gap-3">
              <div className="font-semibold">{lead.data?.client_name || lead.data?.ig_username || senderId}</div>
              <div className="text-xs text-slate-500">
                {lead.data?.phone && <>📞 {lead.data.phone} · </>}
                {lead.data?.city && <>📍 {lead.data.city} · </>}
                {lead.data?.course && <>📦 {lead.data.course}</>}
              </div>
              <button
                onClick={() => mute.mutate(!isMuted)}
                className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border"
              >
                {isMuted ? <Bell size={14} /> : <BellOff size={14} />}
                {isMuted ? "Включить бота" : "Забрать диалог"}
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {(messages.data || []).map((m: any) => (
                <div
                  key={m.id}
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === "human"
                      ? "bg-white"
                      : "bg-sky-600 text-white ml-auto"
                  }`}
                >
                  {m.text}
                  <div className={`text-[10px] mt-1 ${m.role === "human" ? "text-slate-400" : "text-sky-100"}`}>
                    {m.ts && format(new Date(m.ts), "dd.MM HH:mm")}
                    {m.meta?.manual && " · вручную"}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t flex gap-2">
              <input
                className="input flex-1"
                placeholder="Написать от имени врача…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && draft.trim() && send.mutate(draft)}
              />
              <button
                className="btn-primary"
                disabled={!draft.trim() || send.isPending}
                onClick={() => send.mutate(draft)}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}