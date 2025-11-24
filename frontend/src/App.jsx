import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

export default function App() {
  // THEME STATE
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light")
  );

  // APPLY THE THEME TO <html>
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-100 text-white dark:text-black transition-colors duration-500">

      {/* HEADER */}
      <header className="py-6 text-3xl font-bold flex justify-between items-center px-6">
        <span>🔒 Secure Secrets</span>

        {/* THEME TOGGLE BUTTON */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="px-3 py-2 rounded bg-gray-700 dark:bg-gray-200 text-white dark:text-black transition-colors duration-300"
        >
          {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="py-3 text-sm text-gray-400 dark:text-gray-600 text-center">
        © {new Date().getFullYear()} Secure Secrets
      </footer>
    </div>
  );
}
