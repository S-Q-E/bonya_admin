import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useEffect } from "react";
import { WS_URL } from "../api/client";
import { useAuth } from "../store/auth";

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

export default function Dashboard() {
  const token = useAuth((s) => s.token);

  const stats = useQuery({
    queryKey: ["dash-stats"],
    queryFn: () => api.get("/api/dashboard/stats?days=7").then((r) => r.data),
  });
  const ts = useQuery({
    queryKey: ["dash-ts"],
    queryFn: () => api.get("/api/dashboard/timeseries?days=14").then((r) => r.data),
  });
  const recent = useQuery({
    queryKey: ["dash-recent"],
    queryFn: () => api.get("/api/dashboard/recent").then((r) => r.data),
  });

  // live WS ping — просто инвалидируем кэш при изменениях
  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(WS_URL());
    ws.onmessage = () => {
      stats.refetch(); ts.refetch(); recent.refetch();
    };
    return () => ws.close();
  }, [token]);

  if (stats.isLoading) return <div className="p-8">Загрузка…</div>;
  const s = stats.data;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI title="Всего лидов" value={s.total_leads} />
        <KPI title="Лидов за 7 дн" value={s.leads_period} />
        <KPI title="Сообщений (7 дн)" value={s.messages_period} />
        <KPI title="Ошибок (7 дн)" value={s.errors_period} />
        <KPI title="Средний AI, мс" value={Math.round(s.avg_ai_ms)} />
        <KPI title="Средний полный, мс" value={Math.round(s.avg_total_ms)} />
        <KPI title="Лидов из чата" value={s.leads_from_chat} />
        <KPI title="В mute" value={s.muted_now} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Активность за 14 дней">
          <ResponsiveContainer height={260}>
            <LineChart data={ts.data?.timeseries || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={(v) => v?.slice(5,10)} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="messages" name="Сообщения" stroke="#0ea5e9" />
              <Line dataKey="leads" name="Лиды" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Топ городов">
          <ResponsiveContainer height={260}>
            <PieChart>
              <Pie
                data={ts.data?.by_city || []}
                dataKey="cnt" nameKey="city" outerRadius={90} label
              >
                {(ts.data?.by_city || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Тарифы">
          <ResponsiveContainer height={260}>
            <BarChart data={ts.data?.by_course || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="course" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cnt" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Последние ошибки">
          <ul className="divide-y divide-slate-100 text-sm">
            {(recent.data?.errors || []).map((e: any, i: number) => (
              <li key={i} className="py-2">
                <div className="font-medium text-red-600">{e.node_name}</div>
                <div className="text-slate-500 truncate">{e.error_message}</div>
              </li>
            ))}
            {!recent.data?.errors?.length && <li className="py-3 text-slate-400">Пусто</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function KPI({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <div className="text-xs uppercase tracking-wider text-slate-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <div className="font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}