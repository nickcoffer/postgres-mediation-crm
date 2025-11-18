"use client";
import { useState, useEffect } from "react";
import { API_BASE } from "../app/lib/api";

type Todo = {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  is_completed: boolean;
  case: string;
};

type Props = {
  caseId: string;
  onUpdate?: () => void;
};

export default function TodoList({ caseId, onUpdate }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: "", description: "", due_date: "" });

  useEffect(() => {
    loadTodos();
  }, [caseId]);

  async function loadTodos() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/todos/?case=${caseId}`, {
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

  async function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/todos/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newTodo,
          case: caseId,
          due_date: newTodo.due_date || null,
        }),
      });

      if (response.ok) {
        setNewTodo({ title: "", description: "", due_date: "" });
        setIsAddingNew(false);
        loadTodos();
        onUpdate?.();
      }
    } catch (error) {
      console.error("Failed to add todo:", error);
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
        onUpdate?.();
      }
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  }

  async function handleDeleteTodo(todoId: string) {
    if (!confirm("Delete this to-do?")) return;
    
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/todos/${todoId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        loadTodos();
        onUpdate?.();
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  }

  if (loading) return <div className="text-sm text-gray-500">Loading to-dos...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">To-dos</h3>
        <button
          onClick={() => setIsAddingNew(true)}
          className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
        >
          + Add To-do
        </button>
      </div>

      {isAddingNew && (
        <form onSubmit={handleAddTodo} className="bg-purple-50 p-4 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              className="w-full border rounded-md p-2"
              required
              placeholder="e.g. Chase financial disclosure"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              className="w-full border rounded-md p-2"
              rows={2}
              placeholder="Optional details..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={newTodo.due_date}
              onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
              className="border rounded-md p-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setNewTodo({ title: "", description: "", due_date: "" });
              }}
              className="px-4 py-2 border rounded-md"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
              Add To-do
            </button>
          </div>
        </form>
      )}

      {todos.length === 0 ? (
        <div className="text-sm text-gray-500 py-4 text-center">No to-dos yet</div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => {
            const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.is_completed;
            
            return (
              <li
                key={todo.id}
                className={`border rounded-lg p-3 ${
                  todo.is_completed ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={todo.is_completed}
                    onChange={() => handleToggleComplete(todo.id)}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${todo.is_completed ? "line-through text-gray-500" : ""}`}>
                      {todo.title}
                    </div>
                    {todo.description && (
                      <div className="text-sm text-gray-600 mt-1">{todo.description}</div>
                    )}
                    {todo.due_date && (
                      <div
                        className={`text-xs mt-1 ${
                          isOverdue
                            ? "text-red-600 font-medium"
                            : todo.is_completed
                            ? "text-gray-400"
                            : "text-gray-500"
                        }`}
                      >
                        {isOverdue && "⚠️ "}
                        Due: {new Date(todo.due_date).toLocaleDateString("en-GB")}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}