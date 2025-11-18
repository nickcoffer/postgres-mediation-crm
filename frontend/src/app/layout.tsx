"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "../components/Logo";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [practiceName, setPracticeName] = useState("Family Mediation Practice");

  useEffect(() => {
    const saved = localStorage.getItem("practiceName");
    if (saved) setPracticeName(saved);
  }, []);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/", label: "Cases", icon: "📁" },
    { href: "/kanban", label: "Progress View", icon: "📋" },
    { href: "/todos", label: "To-dos", icon: "✅" },
    { href: "/calendar", label: "Calendar", icon: "📅" },
  ];

  return (
    <html lang="en">
      <body>
        <aside className="sidebar">
          <div className="p-6 border-b border-[--border]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[--primary] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                M
              </div>
              <div className="font-bold text-lg text-[--text-primary]">
                Mediation Manager
              </div>
            </div>
            <div className="text-xs text-muted space-y-1">
              <div>Built by Nick Coffer</div>
              <div>at Way Forward Mediation</div>
            </div>
          </div>

          <nav className="py-4">
            <div className="px-3 mb-2">
              <div className="text-xs font-semibold text-[--text-tertiary] uppercase tracking-wider px-4">
                Navigation
              </div>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${
                  pathname === item.href ? "sidebar-item-active" : ""
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[--border]">
            <Link href="/settings" className="sidebar-item">
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </Link>
          </div>
        </aside>

        <div className="ml-64">
          <header className="border-b border-[--border] bg-white sticky top-0 z-10">
            <div className="px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-[--text-primary]">
                  {practiceName}
                </h2>
              </div>
              <div className="text-sm text-muted">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
            </div>
          </header>

          <main className="px-8 py-8 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}
