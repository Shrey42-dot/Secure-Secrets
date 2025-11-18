import { Outlet } from "react-router-dom";

export default function App() {
  console.log("FRONTEND API URL:", import.meta.env.VITE_API_URL);
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
      <header className="py-6 text-3xl font-bold">🔐 Secure Secrets</header>
      <main className="flex-1 w-full max-w-xl p-4">
        <Outlet />
      </main>
      <footer className="py-3 text-sm text-gray-400">© {new Date().getFullYear()} Secure Secrets</footer>
    </div>
  );
}
