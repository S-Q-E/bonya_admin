import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Conversations from "./pages/Conversations";
import Metrics from "./pages/Metrics";
import Errors from "./pages/Errors";
import { useAuth } from "./store/auth";

const qc = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/chats" element={<Conversations />} />
            <Route path="/chats/:senderId" element={<Conversations />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/errors" element={<Errors />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}