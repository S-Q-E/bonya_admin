import { create } from "zustand";

type Auth = {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
};

export const useAuth = create<Auth>((set) => ({
  token: localStorage.getItem("token"),
  setToken: (t) => {
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
    set({ token: t });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ token: null });
  },
}));