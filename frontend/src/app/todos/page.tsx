"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE, ensureLoggedIn } from "../lib/api";

type Todo = {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  is_completed: boolean;
  case: string;
  case_reference: string;
  case_title: string;
};

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    const token = await ensureLoggedIn();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/todos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      }
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleComplete(todoId: string) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/todos/${todoId}/toggle_complete/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        loadTodos();
      }
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">Loading to-dos...</div>
      </div>
    );
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === "pending") return !todo.is_completed;
    if (filter === "completed") return todo.is_completed;
    return true;
  });

  // Sort: overdue first, then by due date, then by created date
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    const now = new Date();
    const aOverdue = a.due_date && new Date(a.due_date) < now && !a.is_completed;
    const bOverdue = b.due_date && new Date(b.due_date) < now && !b.is_completed;

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;

    return 0;
  });

  const pendingCount = todos.filter((t) => !t.is_completed).length;
  const overdueCount = todos.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && !t.is_completed
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg text-[--text-primary]">To-dos</h1>
          <p className="text-muted mt-1">
            {pendingCount} pending
            {overdueCount > 0 && (
              <span className="text-red-600 font-medium"> · {overdueCount} overdue</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-md ${
                filter === "pending"
                  ? "bg-purple-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md ${
                filter === "all"
                  ? "bg-purple-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              All ({todos.length})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-md ${
                filter === "completed"
                  ? "bg-purple-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              Completed ({todos.filter((t) => t.is_completed).length})
            </button>
          </div>
        </div>
      </div>

      {/* To-dos list */}
      <div className="card">
        <div className="card-body">
          {sortedTodos.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <div className="text-4xl mb-2">✅</div>
              <div>
                {filter === "completed" 
                  ? "No completed to-dos"
                  : filter === "pending"
                  ? "No pending to-dos"
                  : "No to-dos yet"}
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {sortedTodos.map((todo) => {
                const isOverdue =
                  todo.due_date &&
                  new Date(todo.due_date) < new Date() &&
                  !todo.is_completed;

                return (
                  <li
                    key={todo.id}
                    className={`border rounded-lg p-4 ${
                      todo.is_completed ? "bg-gray-50" : "bg-white"
                    } ${isOverdue ? "border-red-300" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={todo.is_completed}
                        onChange={() => handleToggleComplete(todo.id)}
                        className="mt-1 w-5 h-5 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div
                              className={`font-medium ${
                                todo.is_completed
                                  ? "line-through text-gray-500"
                                  : ""
                              }`}
                            >
                              {todo.title}
                            </div>
                            {todo.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {todo.description}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <Link
                                href={`/cases/${todo.case}`}
                                className="text-sm text-[--primary] hover:underline"
                              >
                                {todo.case_reference}
                                {todo.case_title && ` · ${todo.case_title}`}
                              </Link>
                              {todo.due_date && (
                                <div
                                  className={`text-xs ${
                                    isOverdue
                                      ? "text-red-600 font-medium"
                                      : todo.is_completed
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {isOverdue && "⚠️ "}
                                  Due:{" "}
                                  {new Date(todo.due_date).toLocaleDateString(
                                    "en-GB"
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}