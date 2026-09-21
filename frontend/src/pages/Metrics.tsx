import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Metrics() {
  const summary = useQuery({
    queryKey: ["m-summary"],
    queryFn: () => api.get("/api/metrics/summary?days=30").then((r) => r.data),
  });
  const hourly = useQuery({
    queryKey: ["m-hourly"],
    queryFn: () => api.get("/api/metrics/hourly?days=7").then((r) => r.data),
  });

  const s = summary.data;
  if (!s) return <div className="p-8">Загрузка…</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Метрики (30 дней)</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI title="Сообщений" value={s.total} />
        <KPI title="Лидов" value={s.leads} />
        <KPI title="Голосовых" value={s.audios} />
        <KPI title="Текстовых" value={s.texts} />
        <KPI title="Avg AI" value={`${s.avg_ai_ms} ms`} />
        <KPI title="p95 AI" value={`${s.p95_ai_ms} ms`} />
        <KPI title="Avg Total" value={`${s.avg_total_ms} ms`} />
        <KPI title="p95 Total" value={`${s.p95_total_ms} ms`} />
      </div>

      <div className="bg-white p-4 rounded-2xl">
        <div className="font-semibold mb-3">Активность по часам (Asia/Almaty)</div>
        <ResponsiveContainer height={280}>
          <BarChart data={hourly.data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cnt" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-2xl">
        <div className="font-semibold mb-3">Языки</div>
        <div className="flex gap-3">
          {s.languages.map((l: any) => (
            <div key={l.lang} className="px-4 py-2 bg-slate-100 rounded-lg">
              <b>{l.lang}</b> · {l.cnt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function KPI({ title, value }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <div className="text-xs uppercase tracking-wider text-slate-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}