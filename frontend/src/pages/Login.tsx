import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../store/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const setToken = useAuth((s) => s.setToken);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setToken(data.access_token);
      nav("/");
    } catch {
      setErr("Неверный логин или пароль");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded-2xl shadow w-96 space-y-4">
        <h1 className="text-2xl font-bold">Bonya Admin</h1>
        <input className="input" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Пароль"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="btn-primary w-full">Войти</button>
      </form>
    </div>
  );
}