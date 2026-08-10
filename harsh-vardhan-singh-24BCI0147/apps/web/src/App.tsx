import { useEffect, useState } from "react";
import { apiFetch } from "./lib/api";

export default function App() {
  const [health, setHealth] = useState<string>("Testing connection...");

  useEffect(() => {
    apiFetch<{ status: string }>("/health")
      .then((data) => setHealth(`API Connected: ${data.status}`))
      .catch((err) => setHealth(`API Error: ${err.message}`));
  }, []);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 gap-4">
      <h1 className="text-4xl font-bold text-primary">pro-t3 (Vite + React)</h1>
      <div className="flex items-center gap-2">
        <div className="badge badge-success badge-lg">{health}</div>
        <button className="btn btn-primary">DaisyUI Button Works!</button>
      </div>
    </div>
  );
}