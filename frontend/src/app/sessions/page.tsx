"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE } from "../lib/api";

type Session = {
  id: string;
  case: string;
  case_reference: string;
  case_title: string;
  party1_name: string;
  party2_name: string;
  session_type: string;
  start: string;
  end: string;
  notes: string;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login first");
      return;
    }

    // Fetch all cases with their sessions
    fetch(`${API_BASE}/api/cases/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((cases) => {
        // Extract all sessions from all cases
        const allSessions: Session[] = [];
        const now = new Date();

        cases.forEach((c: any) => {
          if (c.sessions && c.sessions.length > 0) {
            c.sessions.forEach((s: any) => {
              // Only include future sessions
              if (s.start && new Date(s.start) > now) {
                allSessions.push({
                  ...s,
                  case: c.id,
                  case_reference: c.reference,
                  case_title: c.title,
                  party1_name: c.party1_name,
                  party2_name: c.party2_name,
                });
              }
            });
          }
        });

        // Sort by date (earliest first)
        allSessions.sort((a, b) => 
          new Date(a.start).getTime() - new Date(b.start).getTime()
        );

        setSessions(allSessions);
      })
      .catch((e) => setError(e?.message || "Failed to fetch sessions"));
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="heading-lg text-[--text-primary]">Upcoming Sessions</h1>
        <div className="card">
          <div className="card-body text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  if (!sessions) {
    return (
      <div className="space-y-6">
        <h1 className="heading-lg text-[--text-primary]">Upcoming Sessions</h1>
        <div className="card">
          <div className="card-body text-muted">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg text-[--text-primary]">Upcoming Sessions</h1>
          <p className="text-muted mt-1">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} scheduled
          </p>
        </div>
        <Link href="/dashboard" className="btn">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Sessions List */}
      <div className="card">
        <div className="card-body">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-muted">No upcoming sessions scheduled</div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const startDate = new Date(session.start);
                const endDate = new Date(session.end);
                
                // Format date nicely
                const isToday = startDate.toDateString() === new Date().toDateString();
                const isTomorrow = startDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                
                let dateLabel = startDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });
                
                if (isToday) dateLabel = `Today, ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;
                if (isTomorrow) dateLabel = `Tomorrow, ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;

                const startTime = startDate.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                const endTime = endDate.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

                const parties = [session.party1_name, session.party2_name]
                  .filter(Boolean)
                  .join(" & ") || "Untitled";

                return (
                  <Link
                    key={session.id}
                    href={`/cases/${session.case}`}
                    className="block card bg-white hover:shadow-md transition-all"
                  >
                    <div className="card-body">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Case Reference and Title */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-[--primary]">
                              {session.case_reference}
                            </span>
                            <span className="text-sm text-muted">•</span>
                            <span className="text-sm font-medium text-[--text-primary]">
                              {session.case_title || parties}
                            </span>
                          </div>

                          {/* Session Type */}
                          <div className="text-lg font-semibold text-[--text-primary] mb-2">
                            {session.session_type}
                          </div>

                          {/* Date and Time */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span>📅</span>
                              <span className={isToday || isTomorrow ? "font-semibold text-[--primary]" : ""}>
                                {dateLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🕐</span>
                              <span>{startTime} - {endTime}</span>
                              <span className="text-muted">({duration}h)</span>
                            </div>
                          </div>

                          {/* Parties */}
                          {session.case_title && (session.party1_name || session.party2_name) && (
                            <div className="text-sm text-muted mt-2">
                              {parties}
                            </div>
                          )}
                        </div>

                        {/* Visual indicator for urgency */}
                        {(isToday || isTomorrow) && (
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isToday 
                              ? "bg-red-100 text-red-700" 
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {isToday ? "Today" : "Tomorrow"}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
