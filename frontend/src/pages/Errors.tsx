import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { format } from "date-fns";

export default function Errors() {
  const q = useQuery({
    queryKey: ["errors"],
    queryFn: () => api.get("/api/errors?limit=200").then((r) => r.data),
  });

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Ошибки бота</h1>
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
        {q.data?.items?.map((e: any) => (
          <div key={e.id} className="p-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-red-600">{e.node_name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{e.error_stage}</span>
              <span className="ml-auto text-xs text-slate-400">
                {e.created_at && format(new Date(e.created_at), "dd.MM.yyyy HH:mm")}
              </span>
            </div>
            <div className="text-slate-600 mt-1 break-words">{e.error_message}</div>
            <div className="text-xs text-slate-400 mt-1">
              sender: {e.sender_id || "—"} · exec: {e.execution_id || "—"}
            </div>
          </div>
        ))}
        {!q.data?.items?.length && <div className="p-6 text-center text-slate-400">Ошибок нет 🎉</div>}
      </div>
    </div>
  );
}