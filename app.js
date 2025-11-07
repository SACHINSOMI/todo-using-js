import React, { useEffect, useRef, useState } from "react";

// Single-file Todo List component using React + Tailwind
// Features:
// - Add / Edit / Delete tasks
// - Toggle complete
// - Filter (All / Active / Completed)
// - Persistent storage (localStorage)
// - useRef for input focus and previous filter optimization
// - Responsive and accessible

export default function TodoApp() {
  // Local storage key
  const STORAGE_KEY = "todo_app_tasks_v1";

  // State: tasks
  const [tasks, setTasks] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to read tasks from localStorage", e);
      return [];
    }
  });

  // UI state
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | active | completed

  // Refs
  const inputRef = useRef(null);
  const didMountRef = useRef(false);
  const prevFilterRef = useRef(filter);

  // Focus input when component mounts or when we start editing
  useEffect(() => {
    inputRef.current?.focus();
  }, [editingId]);

  // Persist tasks to localStorage whenever tasks change
  useEffect(() => {
    // skip saving on the very first render if tasks were read from storage
    // (we still allow it; this is just an optimization)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save tasks to localStorage", e);
    }
  }, [tasks]);

  // Performance optimization: keep track of filter changes without causing re-renders
  useEffect(() => {
    prevFilterRef.current = filter;
  }, [filter]);

  // Helpers
  const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const addTask = (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, text: trimmed } : t))
      );
      setEditingId(null);
      setText("");
      return;
    }

    const newTask = {
      id: createId(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setText("");
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setText(task.text);
    // focus handled by effect
  };

  const cancelEdit = () => {
    setEditingId(null);
    setText("");
  };

  const toggleComplete = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  // keyboard shortcuts: Enter to add/save, Escape to cancel editing
  const onInputKeyDown = (e) => {
    if (e.key === "Enter") addTask(e);
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4">
      <main className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6 md:p-8">
        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-semibold">Todo List</h1>
          <p className="text-sm text-gray-500 mt-1">Add tasks, mark complete, edit, filter, and persist across sessions.</p>
        </header>

        <form onSubmit={addTask} className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onInputKeyDown}
            aria-label={editingId ? "Edit task" : "New task"}
            placeholder={editingId ? "Edit task..." : "What needs to be done?"}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-opacity-50"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-60"
            disabled={!text.trim()}
          >
            {editingId ? "Save" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-3 py-2 rounded-lg border ml-1 text-sm"
            >
              Cancel
            </button>
          )}
        </form>

        <section className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">Filter:</div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-md text-sm ${filter === "all" ? "bg-sky-100" : "hover:bg-gray-100"}`}
                aria-pressed={filter === "all"}
              >
                All
              </button>
              <button
                onClick={() => setFilter("active")}
                className={`px-3 py-1 rounded-md text-sm ${filter === "active" ? "bg-sky-100" : "hover:bg-gray-100"}`}
                aria-pressed={filter === "active"}
              >
                Active
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-3 py-1 rounded-md text-sm ${filter === "completed" ? "bg-sky-100" : "hover:bg-gray-100"}`}
                aria-pressed={filter === "completed"}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">{tasks.length} total</div>
            <button
              onClick={clearCompleted}
              className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50"
            >
              Clear completed
            </button>
          </div>
        </section>

        <ul className="space-y-2">
          {filteredTasks.length === 0 && (
            <li className="text-center text-gray-400 py-6">No tasks to show.</li>
          )}

          {filteredTasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-sm"
            >
              <input
                id={`chk-${task.id}`}
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleComplete(task.id)}
                className="w-5 h-5"
                aria-label={`Mark ${task.text} as ${task.completed ? "incomplete" : "complete"}`}
              />

              <div className="flex-1 min-w-0">
                <label htmlFor={`chk-${task.id}`} className={`block break-words ${task.completed ? "line-through text-gray-400" : ""}`}>
                  {task.text}
                </label>
                <div className="text-xs text-gray-400 mt-1">{new Date(task.createdAt).toLocaleString()}</div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(task)} className="text-sm px-2 py-1 rounded-md border hover:bg-gray-50">Edit</button>
                <button onClick={() => removeTask(task.id)} className="text-sm px-2 py-1 rounded-md border text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </li>
          ))}
        </ul>

        <footer className="mt-6 text-sm text-gray-500 text-center">
          Tip: Use Enter to add/save and Esc to cancel edits.
        </footer>
      </main>
    </div>
  );
}
