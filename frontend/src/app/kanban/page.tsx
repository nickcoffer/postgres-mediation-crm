"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_BASE } from "../lib/api";

type Case = {
  id: string;
  reference: string;
  title: string;
  status: "ENQUIRY"|"MIAM"|"OPEN"|"PAUSED"|"CLOSED";
  updated_at: string;
};

const COLUMNS: Array<Case["status"]> = ["ENQUIRY","MIAM","OPEN","PAUSED","CLOSED"];

export default function Kanban(){
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<Case[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(()=>{
    const t = localStorage.getItem("token");
    if(!t){ setError("Please login first"); return; }
    setToken(t);
    fetch(`${API_BASE}/api/cases/`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r=> r.ok ? r.json() : Promise.reject("Failed to fetch cases"))
      .then(setItems).catch((e)=> setError(String(e)));
  },[]);

  async function updateStatus(id:string, status: Case["status"]){
    if(!token) return;
    setItems(prev => prev ? prev.map(c => c.id === id ? { ...c, status } : c) : prev);
    const res = await fetch(`${API_BASE}/api/cases/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type":"application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if(!res.ok){
      setError("Could not update status");
    }
  }

  const grouped = useMemo(()=> {
    const g: Record<string, Case[]> = {};
    COLUMNS.forEach(col => g[col] = []);
    (items || []).forEach(c => { (g[c.status] ||= []).push(c); });
    return g;
  }, [items]);

  if(error) return (
    <div className="space-y-6">
      <h1 className="heading-lg text-[--text-primary]">Progress View</h1>
      <div className="card"><div className="card-body text-red-700">{error}</div></div>
    </div>
  );
  
  if(!items) return (
    <div className="space-y-6">
      <h1 className="heading-lg text-[--text-primary]">Progress View</h1>
      <div className="card"><div className="card-body text-muted">Loading…</div></div>
    </div>
  );

  const columnConfig = {
    ENQUIRY: { label: "Enquiry", emoji: "📨", color: "amber" },
    MIAM: { label: "MIAM", emoji: "🤝", color: "blue" },
    OPEN: { label: "Open", emoji: "📂", color: "emerald" },
    PAUSED: { label: "Paused", emoji: "⏸️", color: "slate" },
    CLOSED: { label: "Closed", emoji: "✅", color: "rose" }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg text-[--text-primary]">Progress View</h1>
          <p className="text-muted mt-1">Drag cases between columns to update their status</p>
        </div>
        <Link href="/" className="btn btn-primary">
          + New Case
        </Link>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-5 gap-4">
        {COLUMNS.map(col => {
          const config = columnConfig[col];
          return (
            <div
              key={col}
              className="flex flex-col"
              onDragOver={(e)=> e.preventDefault()}
              onDrop={(e)=> {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if(id) updateStatus(id, col);
                setDragId(null);
              }}
            >
              {/* Column Header */}
              <div className="card mb-3 bg-stone-50">
                <div className="card-compact">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.emoji}</span>
                      <h2 className="text-sm font-semibold text-[--text-primary]">{config.label}</h2>
                    </div>
                    <span className="bg-white px-2 py-1 rounded-lg text-xs font-medium text-[--text-secondary]">
                      {grouped[col].length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1 min-h-[50vh]">
                {grouped[col].map(c => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className={`
                      block card hover:shadow-md transition-all cursor-move
                      ${dragId===c.id ? "opacity-50 scale-95" : "hover:-translate-y-0.5"}
                    `}
                    draggable
                    onDragStart={(e)=> {
                      setDragId(c.id);
                      e.dataTransfer.setData("text/plain", c.id);
                    }}
                    onDragEnd={()=> setDragId(null)}
                    title={c.title}
                  >
                    <div className="card-compact">
                      <div className="text-xs font-medium text-[--primary] mb-1">
                        {c.reference}
                      </div>
                      <div className="text-sm font-medium text-[--text-primary] mb-2 line-clamp-2">
                        {c.title || "Untitled"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <span>🕐</span>
                        <span>
                          {new Date(c.updated_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {!grouped[col].length && (
                  <div className="card bg-stone-50 border-dashed">
                    <div className="card-body text-center text-muted text-sm py-8">
                      <div className="text-2xl mb-2">📋</div>
                      <div>Drop cases here</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}