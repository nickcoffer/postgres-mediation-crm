"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE } from "../lib/api";
import NewCaseModal from "../../components/NewCaseModal";

export const dynamic = 'force-dynamic';

type Todo = {
  id: string;
  title: string;
  due_date: string | null;
  is_completed: boolean;
  case: string;
  case_reference: string;
  case_title: string;
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(false);

  function handleCaseCreated() {
    setReloadFlag((f) => !f);
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Fetch cases
    fetch(`${API_BASE}/api/cases/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setCases(data);
        calculateStats(data);
      })
      .catch(console.error);

    // Fetch todos
    fetch(`${API_BASE}/api/todos/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setTodos(data);
      })
      .catch(console.error);

    const lastExportDate = localStorage.getItem("lastExportDate");
    if (lastExportDate) {
      setLastExport(lastExportDate);
    }
  }, [reloadFlag]);

  function calculateStats(casesData: any[]) {
    const activeCases = casesData.filter(
      (c) => c.status === "OPEN" || c.status === "MIAM"
    ).length;
    const totalCases = casesData.length;

    const now = new Date();
    let upcomingSessions = 0;
    casesData.forEach((c) => {
      if (c.sessions) {
        c.sessions.forEach((s: any) => {
          if (s.start && new Date(s.start) > now) {
            upcomingSessions++;
          }
        });
      }
    });

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const thisMonthEnquiries = casesData.filter((c) => {
      if (c.enquiry_date) {
        const enquiryDate = new Date(c.enquiry_date);
        return (
          enquiryDate.getMonth() === thisMonth &&
          enquiryDate.getFullYear() === thisYear
        );
      }
      return false;
    }).length;

    let totalOutstanding = 0;
    let unpaidCount = 0;
    
    casesData.forEach((c) => {
      const owed = parseFloat(c.amount_owed || 0);
      const paid = parseFloat(c.amount_paid || 0);
      const outstanding = owed - paid;
      
      if (outstanding > 0) {
        totalOutstanding += outstanding;
        unpaidCount++;
      }
    });

    setStats({
      activeCases,
      totalCases,
      upcomingSessions,
      thisMonthEnquiries,
      outstandingPayments: totalOutstanding,
      unpaidCount,
    });
  }

  function getDaysSinceExport() {
    if (!lastExport) return null;
    const days = Math.floor(
      (Date.now() - new Date(lastExport).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  }

  // Get upcoming and overdue todos
  const now = new Date();
  const upcomingTodos = todos
    .filter((t) => !t.is_completed && t.due_date)
    .sort((a, b) => {
      if (!a.due_date || !b.due_date) return 0;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 5); // Show max 5

  const overdueTodos = upcomingTodos.filter(
    (t) => t.due_date && new Date(t.due_date) < now
  );

  const daysSinceExport = getDaysSinceExport();
  const showBackupReminder = daysSinceExport === null || daysSinceExport > 7;

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[--text-secondary]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg text-[--text-primary]">Dashboard</h1>
          <p className="text-muted mt-1">Welcome back to your mediation practice</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + New Case
        </button>
      </div>

      <NewCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCaseCreated}
      />

      {showBackupReminder && (
        <div className="alert alert-warning flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-xl">⚠️</div>
            <div>
              <div className="font-semibold text-amber-900">Backup Reminder</div>
              <div className="text-sm mt-1">
                {daysSinceExport === null
                  ? "You haven't exported your data yet. We recommend "
                  : `It has been ${daysSinceExport} days since your last data export. We recommend `}
                <Link href="/" className="underline font-medium">
                  exporting your data
                </Link>{" "}
                regularly to keep a local backup.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("lastExportDate", new Date().toISOString());
              window.location.reload();
            }}
            className="text-amber-900 hover:text-amber-700"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        <Link href="/?status=ACTIVE" className="stat-card cursor-pointer">
          <div className="stat-card-icon bg-blue-100 text-blue-600">
            📂
          </div>
          <div className="text-3xl font-bold text-[--text-primary] mb-1">
            {stats.activeCases}
          </div>
          <div className="text-sm text-muted">Active Cases</div>
          <div className="text-xs text-[--text-tertiary] mt-1">
            {stats.totalCases} total cases
          </div>
        </Link>

        <Link href="/sessions" className="stat-card cursor-pointer">
          <div className="stat-card-icon bg-purple-100 text-purple-600">
            📅
          </div>
          <div className="text-3xl font-bold text-[--text-primary] mb-1">
            {stats.upcomingSessions}
          </div>
          <div className="text-sm text-muted">Upcoming Sessions</div>
          <div className="text-xs text-[--text-tertiary] mt-1">
            All future sessions
          </div>
        </Link>

        <Link href="/?status=PAYMENTS" className="stat-card cursor-pointer">
          <div className="stat-card-icon bg-orange-100 text-orange-600">
            £
          </div>
          <div className="text-3xl font-bold text-[--text-primary] mb-1">
            £{stats.outstandingPayments.toFixed(2)}
          </div>
          <div className="text-sm text-muted">Outstanding Payments</div>
          <div className="text-xs text-[--text-tertiary] mt-1">
            {stats.unpaidCount} unpaid
          </div>
        </Link>

        <Link href="/?status=ENQUIRY&month=current" className="stat-card cursor-pointer">
          <div className="stat-card-icon bg-green-100 text-green-600">
            🕐
          </div>
          <div className="text-3xl font-bold text-[--text-primary] mb-1">
            {stats.thisMonthEnquiries}
          </div>
          <div className="text-sm text-muted">This Month</div>
          <div className="text-xs text-[--text-tertiary] mt-1">
            New enquiries
          </div>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h2 className="heading-sm">Upcoming To-dos</h2>
              </div>
              <Link href="/todos" className="text-xs text-[--primary] hover:underline">
                View all
              </Link>
            </div>
            {upcomingTodos.length === 0 ? (
              <div className="text-sm text-muted">No upcoming to-dos</div>
            ) : (
              <ul className="space-y-2">
                {upcomingTodos.map((todo) => {
                  const isOverdue = todo.due_date && new Date(todo.due_date) < now;
                  return (
                    <li key={todo.id} className="text-sm border-l-2 border-purple-400 pl-3 py-1">
                      <Link href={`/cases/${todo.case}`} className="hover:underline">
                        <div className="font-medium">{todo.title}</div>
                        <div className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-medium' : 'text-muted'}`}>
                          {isOverdue && '⚠️ '}
                          {todo.case_reference} · Due {new Date(todo.due_date!).toLocaleDateString('en-GB')}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {overdueTodos.length > 0 && (
              <div className="mt-3 pt-3 border-t text-xs text-red-600 font-medium">
                ⚠️ {overdueTodos.length} overdue
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">£</span>
              <h2 className="heading-sm">Payment Overview</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Total Outstanding</span>
                <span className="font-semibold">£{stats.outstandingPayments.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Overdue</span>
                <span className="font-semibold text-orange-600">£0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">This Month</span>
                <span className="font-semibold text-green-600">£0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="heading-sm mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-3 p-4 rounded-xl border border-[--border] hover:border-[--primary] hover:bg-[--primary-light] transition-all group"
            >
              <div className="text-2xl">📂</div>
              <div className="text-left">
                <div className="font-medium text-sm group-hover:text-[--primary]">
                  New Case
                </div>
                <div className="text-xs text-muted">Start a new case</div>
              </div>
            </button>
            <Link
              href="/"
              className="flex items-center gap-3 p-4 rounded-xl border border-[--border] hover:border-[--primary] hover:bg-[--primary-light] transition-all group"
            >
              <div className="text-2xl">📊</div>
              <div className="text-left">
                <div className="font-medium text-sm group-hover:text-[--primary]">
                  Export Data
                </div>
                <div className="text-xs text-muted">Backup your data</div>
              </div>
            </Link>
            <Link
              href="/kanban"
              className="flex items-center gap-3 p-4 rounded-xl border border-[--border] hover:border-[--primary] hover:bg-[--primary-light] transition-all group"
            >
              <div className="text-2xl">📋</div>
              <div className="text-left">
                <div className="font-medium text-sm group-hover:text-[--primary]">
                  Progress View
                </div>
                <div className="text-xs text-muted">Kanban board</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}