import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import logoMark from "@/assets/kvant-logo.png";

export const Route = createFileRoute("/panel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel interno — kvantcode.ar" },
      {
        name: "description",
        content: "Panel interno de gestión de kvantcode.ar.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PanelPage,
});

const input =
  "w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";

const btn =
  "inline-flex items-center justify-center rounded-lg bg-gradient-primary px-5 py-2.5 font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50";

const btnGhost =
  "rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-accent hover:text-accent disabled:opacity-50";

type PanelRole = "admin" | "staff";

type PanelProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type PanelClient = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type PanelTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type DashboardTask = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
};

type ExpenseSummary = {
  currency: string;
  total: number;
};

type DashboardActivity = {
  id: number;
  at: string;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: Record<string, unknown> | null;
};

type DashboardData = {
  pendingTasks: number;
  overdueTasks: number;
  activeClients: number;
  activeLeads: number;
  expenses: ExpenseSummary[];
  upcomingTasks: DashboardTask[];
  recentActivity: DashboardActivity[];
};

function PanelPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <PanelLogin />;
  }

  return <PanelAccess userId={session.user.id} />;
}

function PanelLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-8 text-center">
            <img
              src={logoMark}
              alt="kvantcode"
              className="mx-auto mb-5 h-14 w-auto"
            />

            <p className="mb-2 text-sm font-medium tracking-wide text-accent">
              // PANEL INTERNO
            </p>

            <h1 className="text-2xl font-semibold">
              Ingreso al sistema
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Acceso exclusivo para usuarios autorizados.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Correo electrónico
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario@kvantcode.ar"
                className={input}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Contraseña
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={input}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`${btn} w-full`}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/admin"
              className="text-sm text-muted-foreground hover:text-accent"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="mt-6 border-t border-border pt-6 text-center">
            <Link to="/" className={btnGhost}>
              Volver al sitio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function PanelAccess({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<PanelRole | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      const { data: isAdmin, error: adminError } = await supabase.rpc(
        "has_role",
        {
          _user_id: userId,
          _role: "admin",
        },
      );

      if (adminError) {
        console.error("Error comprobando rol admin:", adminError);
      }

      if (isAdmin) {
        if (mounted) {
          setRole("admin");
          setLoading(false);
        }

        return;
      }

      const { data: isStaff, error: staffError } = await supabase.rpc(
        "has_role",
        {
          _user_id: userId,
          _role: "staff",
        },
      );

      if (staffError) {
        console.error("Error comprobando rol staff:", staffError);
      }

      if (mounted) {
        setRole(isStaff ? "staff" : null);
        setLoading(false);
      }
    };

    checkRole();

    return () => {
      mounted = false;
    };
  }, [userId]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!role) {
    return <AccessDenied />;
  }

  return <PanelShell role={role} userId={userId} />;
}

function PanelShell({
  role,
  userId,
}: {
  role: PanelRole;
  userId: string;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [section, setSection] = useState("Dashboard");

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  };

  const menuItems = [
    { label: "Dashboard" },
    { label: "Tareas" },
    { label: "Clientes" },
    { label: "Prospectos" },
    ...(role === "admin" ? [{ label: "Gastos" }] : []),
    ...(role === "admin" ? [{ label: "Actividad" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src={logoMark}
              alt="kvantcode"
              className="h-10 w-auto"
            />

            <div>
              <div className="font-semibold">kvantcode</div>

              <div className="text-xs tracking-wide text-accent">
                // panel interno
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
              {role}
            </span>

            <Link to="/" className={btnGhost}>
              Sitio
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className={btnGhost}
            >
              {signingOut ? "Saliendo..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden min-h-[calc(100vh-73px)] w-64 border-r border-border p-5 md:block">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const active = section === item.label;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSection(item.label)}
                  className={`w-full rounded-lg px-4 py-3 text-left text-sm transition ${
                    active
                      ? "bg-accent/10 font-medium text-accent"
                      : "text-muted-foreground hover:bg-accent/5 hover:text-accent"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          {section === "Dashboard" && <Dashboard role={role} />}

          {section === "Tareas" && (
            <TasksModule role={role} userId={userId} />
          )}

          {section === "Clientes" && <ClientsModule role={role} />}

          {section === "Prospectos" && <LeadsModule role={role} />}

          {section === "Gastos" && role === "admin" && (
            <PlaceholderModule
              title="Gastos"
              description="Administración de gastos internos."
            />
          )}

          {section === "Actividad" && role === "admin" && (
            <PlaceholderModule
              title="Actividad"
              description="Registro de actividad del sistema."
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   MÓDULO TAREAS
   ========================================================= */

function TasksModule({
  role,
  userId,
}: {
  role: PanelRole;
  userId: string;
}) {
  const [tasks, setTasks] = useState<PanelTask[]>([]);
  const [profiles, setProfiles] = useState<PanelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("media");
  const [status, setStatus] = useState("pendiente");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const loadTasks = async () => {
    setLoading(true);
    setError("");

    try {
      const [tasksResult, profilesResult] = await Promise.all([
        supabase
          .from("tasks")
          .select(
            "id,title,description,status,priority,due_date,assigned_to,created_by,completed_at,created_at,updated_at",
          )
          .order("completed_at", {
            ascending: true,
            nullsFirst: true,
          })
          .order("due_date", {
            ascending: true,
            nullsFirst: false,
          })
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("profiles")
          .select("id,email,full_name")
          .order("full_name", {
            ascending: true,
            nullsFirst: false,
          }),
      ]);

      if (tasksResult.error) {
        throw tasksResult.error;
      }

      if (profilesResult.error) {
        throw profilesResult.error;
      }

      setTasks((tasksResult.data ?? []) as PanelTask[]);
      setProfiles((profilesResult.data ?? []) as PanelProfile[]);
    } catch (loadError) {
      console.error("Error cargando tareas:", loadError);

      setError(
        "No pudimos cargar las tareas. Revisá la consola para más detalles.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("media");
    setStatus("pendiente");
    setDueDate("");

    if (role === "staff") {
      setAssignedTo(userId);
    } else {
      setAssignedTo("");
    }
  };

  const handleOpenForm = () => {
    setError("");
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  const handleCreateTask = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("El título de la tarea es obligatorio.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const finalAssignedTo =
        role === "staff" ? userId : assignedTo || null;

      const { error: insertError } = await supabase
        .from("tasks")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          due_date: dueDate || null,
          assigned_to: finalAssignedTo,
        });

      if (insertError) {
        throw insertError;
      }

      setShowForm(false);
      resetForm();

      await loadTasks();
    } catch (createError) {
      console.error("Error creando tarea:", createError);

      setError(
        createError instanceof Error
          ? createError.message
          : "No pudimos crear la tarea.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteTask = async (task: PanelTask) => {
    setCompletingId(task.id);
    setError("");

    try {
      const isCompleted = task.completed_at !== null;

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          status: isCompleted ? "pendiente" : "completada",
          completed_at: isCompleted
            ? null
            : new Date().toISOString(),
        })
        .eq("id", task.id);

      if (updateError) {
        throw updateError;
      }

      await loadTasks();
    } catch (completeError) {
      console.error("Error actualizando tarea:", completeError);

      setError(
        completeError instanceof Error
          ? completeError.message
          : "No pudimos actualizar la tarea.",
      );
    } finally {
      setCompletingId(null);
    }
  };

  const handleDeleteTask = async (task: PanelTask) => {
    if (role !== "admin") {
      return;
    }

    const confirmed = window.confirm(
      `¿Querés eliminar la tarea "${task.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (deleteError) {
        throw deleteError;
      }

      await loadTasks();
    } catch (deleteError) {
      console.error("Error eliminando tarea:", deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No pudimos eliminar la tarea.",
      );
    }
  };

  const getProfileName = (profileId: string | null) => {
    if (!profileId) {
      return "Sin asignar";
    }

    const profile = profiles.find(
      (item) => item.id === profileId,
    );

    if (!profile) {
      return "Usuario";
    }

    return profile.full_name || profile.email || "Usuario";
  };

  const getPriorityLabel = (value: string) => {
    switch (value) {
      case "urgente":
        return "Urgente";
      case "alta":
        return "Alta";
      case "baja":
        return "Baja";
      default:
        return "Media";
    }
  };

  const getStatusLabel = (value: string) => {
    switch (value) {
      case "en_progreso":
        return "En progreso";
      case "completada":
        return "Completada";
      default:
        return "Pendiente";
    }
  };

  return (
    <ModuleHeader
      eyebrow="// TAREAS"
      title="Tareas"
      description={
        role === "admin"
          ? "Administración y seguimiento de tareas internas."
          : "Tareas asignadas y creadas por vos."
      }
      actionLabel="Nueva tarea"
      onAction={handleOpenForm}
    >
      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreateTask}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-6">
            <p className="text-sm font-medium tracking-wide text-accent">
              // NUEVA TAREA
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Crear tarea
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Título *
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={input}
                placeholder="Ej.: Configurar servidor"
                required
                autoFocus
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Descripción
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                className={`${input} min-h-28 resize-y`}
                placeholder="Detalles de la tarea..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Responsable
              </label>

              {role === "admin" ? (
                <select
                  value={assignedTo}
                  onChange={(event) =>
                    setAssignedTo(event.target.value)
                  }
                  className={input}
                >
                  <option value="">Sin asignar</option>

                  {profiles.map((profile) => (
                    <option
                      key={profile.id}
                      value={profile.id}
                    >
                      {profile.full_name ||
                        profile.email ||
                        "Usuario"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`${input} flex items-center`}>
                  {getProfileName(userId)}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Prioridad
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                className={input}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Estado
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className={input}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Fecha límite
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(event.target.value)
                }
                className={input}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className={btnGhost}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className={btn}
            >
              {saving ? "Guardando..." : "Guardar tarea"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Lista de tareas
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {tasks.length === 1
                ? "1 tarea"
                : `${tasks.length} tareas`}
            </p>
          </div>

          <button
            type="button"
            onClick={loadTasks}
            disabled={loading}
            className={btnGhost}
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Cargando tareas...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mb-3 text-3xl">✓</div>

            <h3 className="font-semibold">
              No hay tareas todavía
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Creá la primera tarea para comenzar a organizar el trabajo.
            </p>

            <button
              type="button"
              onClick={handleOpenForm}
              className={`${btn} mt-5`}
            >
              + Nueva tarea
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((task) => {
              const completed = task.completed_at !== null;

              return (
                <div
                  key={task.id}
                  className={`p-5 transition ${
                    completed
                      ? "opacity-60"
                      : "hover:bg-background/30"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`font-semibold ${
                            completed ? "line-through" : ""
                          }`}
                        >
                          {task.title}
                        </h3>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${
                            completed
                              ? "border-green-500/30 bg-green-500/10 text-green-400"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {getStatusLabel(task.status)}
                        </span>

                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>

                      {task.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                        <span>
                          👤 {getProfileName(task.assigned_to)}
                        </span>

                        <span>
                          📅{" "}
                          {task.due_date
                            ? formatDate(task.due_date)
                            : "Sin fecha límite"}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteTask(task)}
                        disabled={completingId === task.id}
                        className={completed ? btnGhost : btn}
                      >
                        {completingId === task.id
                          ? "Actualizando..."
                          : completed
                            ? "Reabrir"
                            : "Completar"}
                      </button>

                      {role === "admin" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task)}
                          className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModuleHeader>
  );
}

/* =========================================================
   MÓDULO CLIENTES
   ========================================================= */

function ClientsModule({ role }: { role: PanelRole }) {
  const [clients, setClients] = useState<PanelClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] =
    useState<PanelClient | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "todos" | "activos" | "inactivos"
  >("todos");

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);

  const loadClients = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: loadError } = await supabase
        .from("clients")
        .select(
          "id,name,company,email,phone,notes,active,created_by,created_at,updated_at",
        )
        .order("active", {
          ascending: false,
        })
        .order("name", {
          ascending: true,
        });

      if (loadError) {
        throw loadError;
      }

      setClients((data ?? []) as PanelClient[]);
    } catch (loadError) {
      console.error("Error cargando clientes:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar los clientes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const resetForm = () => {
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setNotes("");
    setActive(true);
    setEditingClient(null);
  };

  const handleOpenNew = () => {
    setError("");
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (client: PanelClient) => {
    setError("");

    setEditingClient(client);
    setName(client.name);
    setCompany(client.company ?? "");
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setNotes(client.notes ?? "");
    setActive(client.active);

    setShowForm(true);
  };

  const handleCancel = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  const handleSaveClient = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: cleanName,
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        active,
      };

      if (editingClient) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", editingClient.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("clients")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }
      }

      setShowForm(false);
      resetForm();

      await loadClients();
    } catch (saveError) {
      console.error("Error guardando cliente:", saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (client: PanelClient) => {
    setProcessingId(client.id);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          active: !client.active,
        })
        .eq("id", client.id);

      if (updateError) {
        throw updateError;
      }

      await loadClients();
    } catch (toggleError) {
      console.error(
        "Error cambiando estado del cliente:",
        toggleError,
      );

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "No pudimos cambiar el estado del cliente.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteClient = async (client: PanelClient) => {
    if (role !== "admin") {
      return;
    }

    const confirmed = window.confirm(
      `¿Querés eliminar el cliente "${client.name}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(client.id);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id);

      if (deleteError) {
        throw deleteError;
      }

      await loadClients();
    } catch (deleteError) {
      console.error("Error eliminando cliente:", deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No pudimos eliminar el cliente.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredClients = clients.filter((client) => {
    if (
      statusFilter === "activos" &&
      !client.active
    ) {
      return false;
    }

    if (
      statusFilter === "inactivos" &&
      client.active
    ) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      client.name,
      client.company,
      client.email,
      client.phone,
      client.notes,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value)
          .toLowerCase()
          .includes(normalizedSearch),
      );
  });

  const activeCount = clients.filter(
    (client) => client.active,
  ).length;

  const inactiveCount = clients.length - activeCount;

  return (
    <ModuleHeader
      eyebrow="// CLIENTES"
      title="Clientes"
      description={
        role === "admin"
          ? "Administración y seguimiento de clientes."
          : "Consulta y gestión de clientes."
      }
      actionLabel="Nuevo cliente"
      onAction={handleOpenNew}
    >
      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Total
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {clients.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Clientes registrados
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Activos
          </p>

          <p className="mt-2 text-2xl font-semibold text-green-400">
            {activeCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Clientes activos
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Inactivos
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {inactiveCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Clientes desactivados
          </p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSaveClient}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-6">
            <p className="text-sm font-medium tracking-wide text-accent">
              {editingClient
                ? "// EDITAR CLIENTE"
                : "// NUEVO CLIENTE"}
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {editingClient
                ? "Editar cliente"
                : "Crear cliente"}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Nombre *
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className={input}
                placeholder="Nombre del cliente"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Empresa
              </label>

              <input
                type="text"
                value={company}
                onChange={(event) =>
                  setCompany(event.target.value)
                }
                className={input}
                placeholder="Empresa o razón social"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className={input}
                placeholder="cliente@empresa.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Teléfono
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                className={input}
                placeholder="+54 11 ..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Estado
              </label>

              <select
                value={active ? "activo" : "inactivo"}
                onChange={(event) =>
                  setActive(
                    event.target.value === "activo",
                  )
                }
                className={input}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Notas
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                className={`${input} min-h-28 resize-y`}
                placeholder="Información adicional del cliente..."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className={btnGhost}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className={btn}
            >
              {saving
                ? "Guardando..."
                : editingClient
                  ? "Guardar cambios"
                  : "Guardar cliente"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">
                Lista de clientes
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                {filteredClients.length === 1
                  ? "1 cliente mostrado"
                  : `${filteredClients.length} clientes mostrados`}
              </p>
            </div>

            <button
              type="button"
              onClick={loadClients}
              disabled={loading}
              className={btnGhost}
            >
              {loading
                ? "Actualizando..."
                : "Actualizar"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className={input}
              placeholder="Buscar por nombre, empresa, email, teléfono o notas..."
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "todos"
                    | "activos"
                    | "inactivos",
                )
              }
              className={`${input} md:w-44`}
            >
              <option value="todos">
                Todos
              </option>

              <option value="activos">
                Activos
              </option>

              <option value="inactivos">
                Inactivos
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Cargando clientes...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mb-3 text-3xl">
              👥
            </div>

            <h3 className="font-semibold">
              {clients.length === 0
                ? "No hay clientes todavía"
                : "No encontramos clientes"}
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              {clients.length === 0
                ? "Creá el primer cliente para comenzar."
                : "Probá con otro término de búsqueda o cambiá el filtro de estado."}
            </p>

            {clients.length === 0 && (
              <button
                type="button"
                onClick={handleOpenNew}
                className={`${btn} mt-5`}
              >
                + Nuevo cliente
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className={`p-5 transition ${
                  client.active
                    ? "hover:bg-background/30"
                    : "opacity-60"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {client.name}
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          client.active
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {client.active
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </div>

                    {client.company && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {client.company}
                      </p>
                    )}

                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      {client.email && (
                        <span className="truncate">
                          ✉️ {client.email}
                        </span>
                      )}

                      {client.phone && (
                        <span>
                          📞 {client.phone}
                        </span>
                      )}

                      <span>
                        📅 Alta:{" "}
                        {formatDateTime(
                          client.created_at,
                        )}
                      </span>

                      {client.updated_at !==
                        client.created_at && (
                        <span>
                          🔄 Actualizado:{" "}
                          {formatDateTime(
                            client.updated_at,
                          )}
                        </span>
                      )}
                    </div>

                    {client.notes && (
                      <div className="mt-3 rounded-lg border border-border bg-background/30 px-3 py-2">
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {client.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleActive(client)
                      }
                      disabled={
                        processingId === client.id
                      }
                      className={btnGhost}
                    >
                      {processingId === client.id
                        ? "Actualizando..."
                        : client.active
                          ? "Desactivar"
                          : "Activar"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenEdit(client)
                      }
                      disabled={
                        processingId === client.id
                      }
                      className={btnGhost}
                    >
                      Editar
                    </button>

                    {role === "admin" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteClient(client)
                        }
                        disabled={
                          processingId === client.id
                        }
                        className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModuleHeader>
  );
}

/* =========================================================
   MÓDULO PROSPECTOS
   ========================================================= */

function LeadsModule({ role }: { role: PanelRole }) {
  return (
    <ModuleHeader
      eyebrow="// PROSPECTOS"
      title="Prospectos"
      description={
        role === "admin"
          ? "Administración y seguimiento de prospectos."
          : "Consulta y gestión de prospectos."
      }
      actionLabel="Nuevo prospecto"
    >
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mb-3 text-3xl">
          🎯
        </div>

        <h2 className="text-lg font-semibold">
          Módulo de prospectos
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          La navegación ya está funcionando. El próximo paso es conectar
          este módulo con la tabla <strong>leads</strong> de Supabase.
        </p>
      </div>
    </ModuleHeader>
  );
}

/* =========================================================
   MÓDULOS PLACEHOLDER
   ========================================================= */

function PlaceholderModule({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <ModuleHeader
      eyebrow={`// ${title.toUpperCase()}`}
      title={title}
      description={description}
    >
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">
          Módulo en preparación
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Esta sección será desarrollada después de completar
          Tareas, Clientes y Prospectos.
        </p>
      </div>
    </ModuleHeader>
  );
}

function ModuleHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium tracking-wide text-accent">
            {eyebrow}
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            {title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {description}
          </p>
        </div>

        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className={btn}
          >
            + {actionLabel}
          </button>
        )}
      </div>

      {children}
    </>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({ role }: { role: PanelRole }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const today = new Date().toISOString().slice(0, 10);

        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);

        const monthStart = firstDayOfMonth
          .toISOString()
          .slice(0, 10);

        const [
          pendingTasksResult,
          overdueTasksResult,
          activeClientsResult,
          activeLeadsResult,
          upcomingTasksResult,
          expensesResult,
          activityResult,
        ] = await Promise.all([
          supabase
            .from("tasks")
            .select("id", {
              count: "exact",
              head: true,
            })
            .is("completed_at", null),

          supabase
            .from("tasks")
            .select("id", {
              count: "exact",
              head: true,
            })
            .is("completed_at", null)
            .lt("due_date", today),

          supabase
            .from("clients")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("active", true),

          supabase
            .from("leads")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("active", true),

          supabase
            .from("tasks")
            .select(
              "id,title,status,priority,due_date",
            )
            .is("completed_at", null)
            .not("due_date", "is", null)
            .gte("due_date", today)
            .order("due_date", {
              ascending: true,
            })
            .limit(5),

          supabase
            .from("expenses")
            .select(
              "amount,currency,spent_on",
            )
            .gte("spent_on", monthStart)
            .lte("spent_on", today)
            .eq("active", true),

          role === "admin"
            ? supabase
                .from("activity_log")
                .select(
                  "id,at,action,entity,entity_id,detail",
                )
                .order("at", {
                  ascending: false,
                })
                .limit(5)
            : Promise.resolve({
                data: [],
                error: null,
              }),
        ]);

        const firstError =
          pendingTasksResult.error ??
          overdueTasksResult.error ??
          activeClientsResult.error ??
          activeLeadsResult.error ??
          upcomingTasksResult.error ??
          expensesResult.error ??
          activityResult.error;

        if (firstError) {
          throw firstError;
        }

        const expenseMap = new Map<string, number>();

        for (const expense of expensesResult.data ?? []) {
          const currency =
            expense.currency || "SIN MONEDA";

          const amount =
            Number(expense.amount) || 0;

          expenseMap.set(
            currency,
            (expenseMap.get(currency) ?? 0) +
              amount,
          );
        }

        const expenses = Array.from(
          expenseMap.entries(),
        )
          .map(([currency, total]) => ({
            currency,
            total,
          }))
          .sort(
            (a, b) => b.total - a.total,
          );

        if (!mounted) {
          return;
        }

        setData({
          pendingTasks:
            pendingTasksResult.count ?? 0,
          overdueTasks:
            overdueTasksResult.count ?? 0,
          activeClients:
            activeClientsResult.count ?? 0,
          activeLeads:
            activeLeadsResult.count ?? 0,
          expenses,
          upcomingTasks:
            (upcomingTasksResult.data ??
              []) as DashboardTask[],
          recentActivity:
            (activityResult.data ??
              []) as DashboardActivity[],
        });
      } catch (dashboardError) {
        console.error(
          "Error cargando dashboard:",
          dashboardError,
        );

        if (mounted) {
          setError(
            "No pudimos cargar los datos del dashboard.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [role]);

  if (loading) {
    return (
      <>
        <div className="mb-8">
          <p className="text-sm font-medium tracking-wide text-accent">
            // DASHBOARD
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Panel interno
          </h1>

          <p className="mt-2 text-muted-foreground">
            Cargando información...
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-xl border border-border bg-card"
              />
            ),
          )}
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <div className="mb-8">
          <p className="text-sm font-medium tracking-wide text-accent">
            // DASHBOARD
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Panel interno
          </h1>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400">
          {error ||
            "No hay datos disponibles."}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium tracking-wide text-accent">
          // DASHBOARD
        </p>

        <h1 className="mt-2 text-3xl font-semibold">
          Panel interno
        </h1>

        <p className="mt-2 text-muted-foreground">
          Resumen de la actividad interna de kvantcode.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStat
          title="Tareas pendientes"
          value={data.pendingTasks}
          description="Tareas sin completar"
        />

        <DashboardStat
          title="Tareas vencidas"
          value={data.overdueTasks}
          description="Pendientes con fecha vencida"
          alert={data.overdueTasks > 0}
        />

        <DashboardStat
          title="Clientes activos"
          value={data.activeClients}
          description="Clientes actualmente activos"
        />

        <DashboardStat
          title="Prospectos activos"
          value={data.activeLeads}
          description="Oportunidades en seguimiento"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Próximas tareas">
          {data.upcomingTasks.length === 0 ? (
            <EmptyState message="No hay tareas próximas." />
          ) : (
            <div className="divide-y divide-border">
              {data.upcomingTasks.map(
                (task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {task.title}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {task.priority && (
                          <span>
                            Prioridad:{" "}
                            {task.priority}
                          </span>
                        )}

                        {task.status && (
                          <span>
                            Estado:{" "}
                            {task.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 text-sm text-accent">
                      {formatDate(
                        task.due_date,
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Gastos del mes">
          {data.expenses.length === 0 ? (
            <EmptyState message="No hay gastos registrados este mes." />
          ) : (
            <div className="space-y-3">
              {data.expenses.map(
                (expense) => (
                  <div
                    key={expense.currency}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">
                      {expense.currency}
                    </span>

                    <span className="font-semibold">
                      {formatAmount(
                        expense.total,
                        expense.currency,
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </DashboardSection>
      </div>

      {role === "admin" && (
        <div className="mt-6">
          <DashboardSection title="Actividad reciente">
            {data.recentActivity.length === 0 ? (
              <EmptyState message="No hay actividad registrada." />
            ) : (
              <div className="divide-y divide-border">
                {data.recentActivity.map(
                  (activity) => (
                    <div
                      key={activity.id}
                      className="py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">
                            {activity.action}
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {activity.entity}
                            {activity.entity_id
                              ? ` · ${activity.entity_id}`
                              : ""}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDateTime(
                            activity.at,
                          )}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </DashboardSection>
        </div>
      )}
    </>
  );
}

function DashboardStat({
  title,
  value,
  description,
  alert = false,
}: {
  title: string;
  value: number;
  description: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-5 transition ${
        alert
          ? "border-red-500/40"
          : "border-border hover:border-accent/50"
      }`}
    >
      <p className="text-sm text-muted-foreground">
        {title}
      </p>

      <p
        className={`mt-3 text-3xl font-semibold ${
          alert
            ? "text-red-400"
            : "text-foreground"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function DashboardSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-2 font-semibold">
        {title}
      </h2>

      {children}
    </section>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const [year, month, day] =
    value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function formatAmount(
  amount: number,
  _currency: string,
) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function AccessDenied() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
        <div className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mb-5 text-4xl">
            🔒
          </div>

          <h1 className="text-2xl font-semibold">
            Acceso no autorizado
          </h1>

          <p className="mt-3 text-muted-foreground">
            Tu cuenta está autenticada, pero no tiene permisos para acceder
            al panel interno.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/" className={btnGhost}>
              Volver al sitio
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className={btn}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <img
          src={logoMark}
          alt="kvantcode"
          className="mx-auto mb-4 h-12 w-auto opacity-80"
        />

        <p className="text-sm text-muted-foreground">
          Cargando panel...
        </p>
      </div>
    </main>
  );
}