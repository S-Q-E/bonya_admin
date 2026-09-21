import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, MessageCircle, BarChart3, AlertTriangle, LogOut,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../store/auth";

const nav = [
  { to: "/", label: "Дашборд", icon: LayoutDashboard, end: true },
  { to: "/leads", label: "Лиды", icon: Users },
  { to: "/chats", label: "Диалоги", icon: MessageCircle },
  { to: "/metrics", label: "Метрики", icon: BarChart3 },
  { to: "/errors", label: "Ошибки", icon: AlertTriangle },
];

export default function Layout() {
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-5 text-xl font-semibold border-b border-slate-800">
          Bonya Admin
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60"
                )
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="m-3 flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-slate-300 hover:bg-slate-800"
        >
          <LogOut size={18} /> Выйти
        </button>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}