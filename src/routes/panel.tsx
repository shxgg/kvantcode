import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useEffect,
  useState,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  clearPasswordRecovery,
  usePasswordRecoveryState,
} from "@/integrations/supabase/password-recovery";
import logoIcon from "@/assets/branding/kvantcode-icon-512.png";
import logoHorizontal from "@/assets/branding/kvantcode-horizontal.png";

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

type PanelLead = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: "nuevo" | "contactado" | "propuesta" | "ganado" | "perdido";
  next_follow_up: string | null;
  notes: string | null;
  converted_client_id: string | null;
  won_by_user_id: string | null;
  won_by_name: string | null;
  won_at: string | null;
  converted_by_user_id: string | null;
  converted_by_name: string | null;
  converted_at: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type PanelExpense = {
  id: string;
  spent_on: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  vendor: string | null;
  client_id: string | null;
  active: boolean;
  created_by: string | null;
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
  const recovery = usePasswordRecoveryState();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Error obteniendo sesión:", error);
        setSession(null);
      } else {
        setSession(session);
      }

      setLoading(false);
    };

    void loadSession();

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

  if (loading || !recovery.ready) {
    return <LoadingScreen />;
  }

  if (recovery.pending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mb-5 text-4xl">🔐</div>
          <h1 className="text-2xl font-semibold">
            Recuperación de contraseña
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Para continuar, primero tenés que establecer una nueva
            contraseña desde el enlace de recuperación.
          </p>
          <Link to="/reset-password" className={`${btn} mt-7 w-full`}>
            Continuar con la recuperación
          </Link>
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className={`${btnGhost} mt-4`}
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    );
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
    } else {
      clearPasswordRecovery();
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-8 text-center">
            <img
              src={logoIcon}
              alt="kvantcode"
              className="mx-auto mb-5 h-14 w-auto"
            />
            <p className="mb-2 text-sm font-medium tracking-wide text-accent">
              // PANEL INTERNO
            </p>
            <h1 className="text-2xl font-semibold">Ingreso al sistema</h1>
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
                placeholder="Correo electrónico"
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
        { _user_id: userId, _role: "admin" },
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
        { _user_id: userId, _role: "staff" },
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

  if (loading) return <LoadingScreen />;
  if (!role) return <AccessDenied />;

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
    { label: "Kanban" },
    { label: "Tareas" },
    { label: "Agenda" },
    { label: "Clientes" },
    { label: "Prospectos" },
    ...(role === "admin" ? [{ label: "Gastos" }] : []),
    ...(role === "admin" ? [{ label: "Actividad" }] : []),
  ];

  const panelWidth = ["Dashboard", "Kanban", "Tareas"].includes(section) ? "w-full" : "max-w-7xl";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className={"mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 " + panelWidth}>
          <div className="flex items-center gap-3">
            <img src={logoHorizontal} alt="kvantcode" className="h-10 w-auto max-w-[190px] object-contain" />
            <span className="hidden text-xs tracking-wide text-accent sm:inline">
              // panel interno
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
              {role}
            </span>
            {role === "admin" && (
              <Link to="/admin" className={btnGhost}>
                Administración
              </Link>
            )}
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

      <div className={"mx-auto flex " + panelWidth}>
        <aside className="hidden min-h-[calc(100vh-73px)] w-52 shrink-0 border-r border-border p-4 md:block 2xl:w-60">
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

        <main className="min-w-0 flex-1 p-4 sm:p-6 2xl:p-8">
          <nav aria-label="Secciones del panel" className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {menuItems.map((item) => <button type="button" key={item.label} className={btnGhost}
              aria-current={section === item.label ? "page" : undefined}
              onClick={() => setSection(item.label)}>{item.label}</button>)}
          </nav>
          {section === "Kanban" && <TasksModule key="kanban" role={role} userId={userId} initialView="kanban" />}
          {section === "Dashboard" && <Dashboard role={role} userId={userId} />}
          {section === "Agenda" && <AgendaModule role={role} />}
          {section === "Tareas" && (
            <TasksModule role={role} userId={userId} />
          )}
          {section === "Clientes" && <ClientsModule role={role} />}
          {section === "Prospectos" && <LeadsModule role={role} />}
          {section === "Gastos" && role === "admin" && (
            <ExpensesModule />
          )}
          {section === "Actividad" && role === "admin" && (
            <ActivityModule />
          )}
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   MÓDULO TAREAS
   ========================================================= */

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
type TaskComment = { id: string; task_id: string; author_id: string; content: string; created_at: string; updated_at: string };

const taskStates = [
  { value: "pendiente", label: "Pendiente", badge: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  { value: "en_curso", label: "En curso", badge: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  { value: "hecha", label: "Hecha", badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
];

const taskListColumns = [
  { label: "Asunto", width: "w-[26%]" },
  { label: "Creador", width: "w-[14%]" },
  { label: "Responsable", width: "w-[14%]" },
  { label: "Prioridad", width: "w-[8%]" },
  { label: "Estado", width: "w-[12%]" },
  { label: "Vencimiento", width: "w-[11%]" },
  { label: "Acciones", width: "w-[15%]" },
];

type TaskAttachment = {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number;
  created_at: string;
};

type TaskAttachmentInsert = Pick<TaskAttachment, "id" | "task_id" | "file_name" | "storage_path" | "file_size">
  & Partial<Pick<TaskAttachment, "mime_type">>;

type TaskAttachmentDatabase = {
  public: {
    Tables: {
      task_attachments: {
        Row: TaskAttachment;
        Insert: TaskAttachmentInsert;
        Update: Partial<TaskAttachment>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
  };
};

// Reuse the authenticated client even when the project's generated types predate this table.
const attachmentTable = () =>
  (supabase as unknown as SupabaseClient<TaskAttachmentDatabase>).from("task_attachments");
const attachmentFields = "id,file_name,storage_path,mime_type,file_size,created_at";
type TaskAttachmentSummary = Pick<TaskAttachment, "id" | "file_name" | "storage_path" | "mime_type" | "file_size" | "created_at">;
const maxAttachmentSize = 10 * 1024 * 1024;
const invalidAttachmentMessage = "Elegí un archivo con nombre, que no esté vacío y que pese hasta 10 MiB.";

function isValidTaskAttachment(file: File) {
  return file.name.trim().length > 0 && file.size > 0 && file.size <= maxAttachmentSize;
}

async function saveTaskAttachment(taskId: string, file: File): Promise<TaskAttachmentSummary> {
  const id = crypto.randomUUID();
  const storagePath = `tasks/${taskId}/${id}`;
  const bucket = supabase.storage.from("task-attachments");
  const { error: uploadError } = await bucket.upload(storagePath, file, {
    upsert: false,
    cacheControl: "0",
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) {
    console.error("Error subiendo adjunto:", uploadError);
    throw new Error(`No se confirmó la subida. Si la conexión se interrumpió, revisá ${storagePath} en Storage antes de reintentar.`);
  }

  const saved = await attachmentTable().insert({
    id,
    task_id: taskId,
    file_name: file.name.trim(),
    storage_path: storagePath,
    mime_type: file.type || null,
    file_size: file.size,
  }).select(attachmentFields).single();

  let attachment = saved.data;
  if (saved.error) {
    console.error("Error registrando adjunto:", saved.error);
    // Only delete the object after an explicit database rejection.
    const rejected = saved.status >= 400 && /^(22|23|42)[0-9A-Z]{3}$/.test(saved.error.code);
    if (rejected) {
      const { data: removed, error: cleanupError } = await bucket.remove([storagePath]);
      if (cleanupError || !removed?.length) {
        console.error("Error limpiando adjunto:", cleanupError);
        throw new Error(`No se pudo registrar el adjunto. Revisá el archivo ${storagePath} en Storage.`);
      }
      throw new Error("No se pudo registrar el adjunto. El archivo subido se retiró de Storage.");
    }

    const confirmed = await attachmentTable().select(attachmentFields).eq("id", id).maybeSingle();
    attachment = confirmed.data;
    if (confirmed.error || !attachment) {
      throw new Error(`No se pudo confirmar el registro. Volvé a cargar la lista y, si falta el adjunto, revisá ${storagePath} en Storage.`);
    }
  }

  if (!attachment) throw new Error("No se recibió el registro del adjunto. Volvé a cargar la lista.");
  return attachment;
}

const imageMimeTypes = /^image\/(jpeg|png|gif|webp|avif|bmp|x-ms-bmp)$/i;
const imageFileExtensions = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;

function canPreviewAttachment(attachment: TaskAttachmentSummary) {
  const type = attachment.mime_type?.toLowerCase();
  return imageMimeTypes.test(type ?? "") ||
    ((!type || type === "application/octet-stream") && imageFileExtensions.test(attachment.file_name));
}

function TaskAttachmentPreview({ attachment, onDismiss }: {
  attachment: TaskAttachmentSummary;
  onDismiss: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const path = attachment.storage_path;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const closePreview = () => {
    dialogRef.current?.close();
    onDismiss();
  };

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    void (async () => {
      try {
        const { data, error } = await supabase.storage.from("task-attachments").download(path);
        if (error || !data) throw error ?? new Error("Imagen no disponible.");
        if (!active) return;
        if (data.type && data.type !== "application/octet-stream" && !imageMimeTypes.test(data.type)) {
          setFailed(true);
          return;
        }
        objectUrl = URL.createObjectURL(data);
        setUrl(objectUrl);
      } catch {
        if (active) setFailed(true);
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="task-attachment-preview-title"
      className="fixed inset-0 m-auto max-h-[92dvh] w-11/12 max-w-6xl overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/80"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        closePreview();
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-xs text-muted-foreground">Vista previa</p>
          <h4 id="task-attachment-preview-title" className="font-semibold [overflow-wrap:anywhere]">
            {attachment.file_name}
          </h4>
        </div>
        <button type="button" className={btnGhost} onClick={closePreview}>Cerrar vista previa</button>
      </header>
      <div className="bg-background/40 p-4 text-center">
        {failed ? (
          <p role="alert" className="text-sm text-red-400">No se pudo mostrar la imagen. Podés intentar descargarla.</p>
        ) : url ? (
          <img src={url} alt={attachment.file_name} onError={() => setFailed(true)}
            className="mx-auto max-h-[76dvh] max-w-full rounded-lg object-contain" />
        ) : (
          <p role="status" className="text-sm text-muted-foreground">Cargando vista previa…</p>
        )}
      </div>
    </dialog>
  );
}

function TaskAttachments({ taskId, onWriteBusyChange }: {
  taskId: string;
  onWriteBusyChange: (busy: boolean) => void;
}) {
  const [attachments, setAttachments] = useState<TaskAttachmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [operation, setOperation] = useState<"upload" | "download" | "delete" | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewAttachment = attachments.find((attachment) => attachment.id === previewId);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const operationLock = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);

    void (async () => {
      try {
        const { data, error: queryError } = await attachmentTable()
          .select(attachmentFields).eq("task_id", taskId).order("created_at", { ascending: false });
        if (queryError) throw queryError;
        if (active) setAttachments(data ?? []);
      } catch (queryError) {
        if (active) setLoadError(true);
        console.error("Error cargando adjuntos:", queryError);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [taskId, reload]);

  const uploadAttachment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || loading || operationLock.current) return;
    setError("");
    setNotice("");

    if (!isValidTaskAttachment(file)) {
      setError(invalidAttachmentMessage);
      return;
    }

    operationLock.current = true;
    setOperation("upload");
    onWriteBusyChange(true);
    try {
      const uploaded = await saveTaskAttachment(taskId, file);
      setAttachments((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setNotice("Adjunto subido.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir el archivo.");
    } finally {
      operationLock.current = false;
      setOperation(null);
      onWriteBusyChange(false);
    }
  };

  const downloadAttachment = async (attachment: TaskAttachmentSummary) => {
    if (operationLock.current) return;
    operationLock.current = true;
    setOperation("download");
    setError("");
    setNotice("");
    try {
      const { data, error: downloadError } = await supabase.storage
        .from("task-attachments").download(attachment.storage_path);
      if (downloadError || !data) throw downloadError ?? new Error("Archivo no disponible.");

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.file_name;
      document.body.append(link);
      try {
        link.click();
      } finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }
    } catch (downloadError) {
      console.error("Error descargando adjunto:", downloadError);
      setError("No se pudo descargar el archivo. Revisá la conexión y los permisos de Storage.");
    } finally {
      operationLock.current = false;
      setOperation(null);
    }
  };

  const deleteAttachment = async (attachment: TaskAttachmentSummary) => {
    if (loading || operationLock.current) return;
    if (!window.confirm(`¿Eliminar definitivamente el adjunto “${attachment.file_name}”?`)) return;

    operationLock.current = true;
    setOperation("delete");
    onWriteBusyChange(true);
    setPreviewId((current) => current === attachment.id ? null : current);
    setError("");
    setNotice("");
    try {
      const { error: storageError } = await supabase.storage
        .from("task-attachments").remove([attachment.storage_path]);
      if (storageError) {
        console.error("Error eliminando archivo de Storage:", storageError);
        throw new Error("No se pudo confirmar el borrado del archivo. Volvé a intentar.");
      }

      // A repeat can reach this step after the object was removed on the first attempt.
      const { error: recordError } = await attachmentTable().delete()
        .eq("task_id", taskId).eq("id", attachment.id);
      if (recordError) {
        console.error("Error eliminando el registro del adjunto:", recordError);
        throw new Error("Se eliminó el archivo, pero quedó su registro. Volvé a elegir Eliminar para terminar.");
      }

      setAttachments((current) => current.filter((item) => item.id !== attachment.id));
      setNotice("Adjunto eliminado.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el adjunto.");
    } finally {
      operationLock.current = false;
      setOperation(null);
      onWriteBusyChange(false);
    }
  };

  return (
    <section aria-labelledby="task-attachments-title" className="mt-6 min-w-0 border-t border-border pt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 id="task-attachments-title" className="font-semibold">Adjuntos privados ({attachments.length})</h3>
        <button type="button" className={btnGhost} disabled={loading || operation !== null}
          onClick={() => setReload((value) => value + 1)}>Actualizar adjuntos</button>
      </div>
      {loading && <p role="status" className="text-sm text-muted-foreground">Cargando adjuntos…</p>}
      {loadError && <p role="alert" className="text-sm text-red-400">No se pudo cargar la lista de adjuntos.</p>}
      {!loading && !loadError && attachments.length === 0 && (
        <p className="text-sm text-muted-foreground">Todavía no hay archivos adjuntos.</p>
      )}
      <ul className="space-y-2">
        {attachments.map((attachment) => (
          <li key={attachment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0 flex-1 basis-52 [overflow-wrap:anywhere]">
              <p className="text-sm font-medium">{attachment.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Intl.NumberFormat("es-AR").format(attachment.file_size)} bytes · {formatDateTime(attachment.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canPreviewAttachment(attachment) && (
                <button type="button" className={btnGhost} aria-haspopup="dialog"
                  aria-label={"Previsualizar " + attachment.file_name}
                  disabled={loading || operation !== null}
                  onClick={(event) => {
                    event.currentTarget.focus({ preventScroll: true });
                    setPreviewId(attachment.id);
                  }}>Previsualizar</button>
              )}
              <button type="button" className={btnGhost} aria-label={"Descargar " + attachment.file_name}
                disabled={operation !== null} onClick={() => void downloadAttachment(attachment)}>Descargar</button>
              <button type="button" className={btnGhost} aria-label={"Eliminar " + attachment.file_name}
                disabled={loading || operation !== null} onClick={() => void deleteAttachment(attachment)}>Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={uploadAttachment}>
        <label className="block min-w-0 flex-1 basis-60 text-sm">
          Seleccioná un archivo (hasta 10 MiB)
          <input ref={fileInputRef} type="file" className={input + " mt-1"} disabled={operation !== null}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
        </label>
        <button type="submit" className={btn} disabled={!file || loading || operation !== null}>
          {operation === "upload" ? "Subiendo…" : "Subir archivo"}
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-400 [overflow-wrap:anywhere]">{error}</p>}
      <p role="status" className="mt-2 text-sm text-muted-foreground">
        {operation === "download" ? "Descargando…" : operation === "delete" ? "Eliminando adjunto…" : notice}
      </p>
      {previewAttachment && (
        <TaskAttachmentPreview key={previewAttachment.storage_path} attachment={previewAttachment}
          onDismiss={() => setPreviewId(null)} />
      )}
    </section>
  );
}


function TasksModule({
  role,
  userId,
  initialView = "lista",
  onTasksChanged,
}: {
  role: PanelRole;
  userId: string;
  initialView?: "lista" | "kanban" | "calendario";
  onTasksChanged?: () => void;
}) {
  const [tasks, setTasks] = useState<PanelTask[]>([]);
  const [profiles, setProfiles] = useState<PanelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const [view, setView] = useState(initialView);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sortBy, setSortBy] = useState("due");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDialogElement | null>(null);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const canUpdate = (task: PanelTask) => role === "admin" || task.assigned_to === userId;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("media");
  const [editStatus, setEditStatus] = useState("pendiente");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [attachmentWriting, setAttachmentWriting] = useState(false);
  const newTaskFileRef = useRef<HTMLInputElement | null>(null);


  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("media");
  const [status, setStatus] = useState("pendiente");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const loadTasks = async () => {
    setLoading(true);
    setLoadFailed(false);
    setError("");

    try {
      const [tasksResult, profilesResult] = await Promise.all([
        supabase
          .from("tasks")
          .select(
            "id,title,description,status,priority,due_date,assigned_to,created_by,completed_at,created_at,updated_at",
          )
          .order("completed_at", { ascending: true, nullsFirst: true })
          .order("due_date", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false }),

        supabase
          .from("profiles")
          .select("id,email,full_name")
          .order("full_name", { ascending: true, nullsFirst: false }),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (profilesResult.error) throw profilesResult.error;

      setTasks((tasksResult.data ?? []) as PanelTask[]);
      setProfiles((profilesResult.data ?? []) as PanelProfile[]);
    } catch (loadError) {
      setLoadFailed(true);
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

  useEffect(() => {
    setEditing(false);
    setComments([]);
    setCommentsError("");
    setCommentText("");
    if (!selectedId) return;
    let active = true;
    setCommentsLoading(true);
    void (async () => {
      const { data, error: queryError } = await supabase.from("task_comments")
        .select("id,task_id,author_id,content,created_at,updated_at")
        .eq("task_id", selectedId).order("created_at", { ascending: true });
      if (!active) return;
      if (queryError) setCommentsError(queryError.message);
      else setComments((data ?? []) as TaskComment[]);
      setCommentsLoading(false);
    })();
    return () => { active = false; };
  }, [selectedId]);

  const openTaskEdit = (task: PanelTask) => {
    if (!canUpdate(task)) return;
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(task.due_date ?? "");
    setEditAssignee(task.assigned_to ?? "");
    setEditing(true);
    setError("");
  };

  const saveTaskEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const task = tasks.find(item => item.id === selectedId);
    if (!task || !canUpdate(task) || !editTitle.trim() || lock.current) return;
    lock.current = true;
    setEditSaving(true);
    setError("");
    try {
      const { data, error: updateError } = await supabase.from("tasks").update({
        title: editTitle.trim(), description: editDescription.trim() || null,
        priority: editPriority, status: editStatus, due_date: editDueDate || null,
        ...(role === "admin" ? { assigned_to: editAssignee || null } : {}),
      }).eq("id", task.id)
        .select("id,title,description,status,priority,due_date,assigned_to,created_by,completed_at,created_at,updated_at").single();
      if (updateError) throw updateError;
      setTasks(current => current.map(item => item.id === task.id ? data as PanelTask : item));
      setEditing(false);
      setNotice("Tarea actualizada correctamente.");
      onTasksChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la tarea.");
    } finally { lock.current = false; setEditSaving(false); }
  };

  const addTaskComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !commentText.trim() || commentSaving) return;
    setCommentSaving(true);
    setCommentsError("");
    try {
      const { data, error: insertError } = await supabase.from("task_comments")
        .insert({ task_id: selectedId, author_id: userId, content: commentText.trim() })
        .select("id,task_id,author_id,content,created_at,updated_at").single();
      if (insertError) throw insertError;
      setComments(current => [...current, data as TaskComment]);
      setCommentText("");
    } catch (err) {
      setCommentsError(err instanceof Error ? err.message : "No se pudo agregar la nota.");
    } finally { setCommentSaving(false); }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("media");
    setStatus("pendiente");
    setDueDate("");
    setAssignedTo(role === "staff" ? userId : "");
    if (newTaskFileRef.current) {
      newTaskFileRef.current.value = "";
      newTaskFileRef.current.setCustomValidity("");
    }
  };

  const handleOpenForm = () => {
    if (lock.current || loading) return;
    setError("");
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    if (saving) return;
    setShowForm(false);
    resetForm();
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("El título de la tarea es obligatorio.");
      return;
    }

    if (lock.current || loading) return;
    const attachment = role === "admin" ? newTaskFileRef.current?.files?.[0] : undefined;
    if (attachment && !isValidTaskAttachment(attachment)) {
      setError(invalidAttachmentMessage);
      return;
    }

    lock.current = true;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const finalAssignedTo =
        role === "staff" ? userId : assignedTo || null;

      const insertTask = supabase.from("tasks").insert({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate || null,
        assigned_to: finalAssignedTo,
        created_by: userId,
      });

      const { data, error: insertError } = await (attachment ? insertTask.select("id").single() : insertTask);
      if (insertError) throw insertError;

      const taskId = data?.id;
      let attachmentError = "";
      if (attachment) {
        try {
          if (!taskId) throw new Error("No se recibió el identificador de la tarea.");
          await saveTaskAttachment(taskId, attachment);
        } catch (uploadError) {
          console.error("Error adjuntando archivo a la nueva tarea:", uploadError);
          attachmentError = uploadError instanceof Error ? uploadError.message : "No se pudo subir el archivo.";
        }
      }

      setShowForm(false);
      resetForm();
      await loadTasks();
      if (attachmentError) {
        setError("La tarea se guardó. Revisá sus adjuntos antes de volver a subir el archivo. " + attachmentError);
        if (taskId) setSelectedId(taskId);
      } else if (attachment) {
        setNotice("Tarea guardada con su adjunto.");
      }
      onTasksChanged?.();
    } catch (createError) {
      console.error("Error creando tarea:", createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "No pudimos crear la tarea.",
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };

  const handleStatusChange = async (task: PanelTask, nextStatus: string) => {
    if (!canUpdate(task) || lock.current || loading || saving || task.status === nextStatus) return;
    if (!["pendiente", "en_curso", "hecha"].includes(nextStatus)) return;
    lock.current = true;
    setCompletingId(task.id);
    setError("");
    setNotice("");
    try {
      const { data, error: updateError } = await supabase.from("tasks")
        .update({ status: nextStatus }).eq("id", task.id)
        .select("id,title,description,status,priority,due_date,assigned_to,created_by,completed_at,created_at,updated_at")
        .single();
      if (updateError) throw updateError;
      if (!data) throw new Error("Sin permisos o tarea no disponible.");
      setTasks((current) => current.map((item) => item.id === task.id ? data as PanelTask : item));
      setNotice("Estado actualizado: " + task.title);
      onTasksChanged?.();
    } catch (error) {
      console.error(error);
      setError("No pudimos cambiar el estado. Actualizá la lista y revisá tus permisos o conexión.");
    } finally {
      lock.current = false;
      setCompletingId(null);
      setDraggedId(null);
    }
  };
  const handleCompleteTask = (task: PanelTask) =>
    handleStatusChange(task, task.status === "hecha" ? "pendiente" : "hecha");

  const handleDeleteTask = async (task: PanelTask) => {
    if (role !== "admin" || lock.current || saving || loading) return;

    const confirmed = window.confirm(
      `¿Querés eliminar la tarea "${task.title}"?`,
    );
    if (!confirmed) return;

    lock.current = true;
    setCompletingId(task.id);
    setError("");

    try {
      const { data: deleted, error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id).select("id").single();

      if (deleteError) throw deleteError;
      if (!deleted) throw new Error("No se pudo eliminar la tarea.");
      await loadTasks();
      onTasksChanged?.();
    } catch (deleteError) {
      console.error("Error eliminando tarea:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No pudimos eliminar la tarea.",
      );
    } finally {
      lock.current = false;
      setCompletingId(null);
    }
  };

  const getProfileName = (profileId: string | null) => {
    if (!profileId) return "Sin asignar";
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile) return "Usuario";
    return profile.full_name || profile.email || "Usuario";
  };

  const getPriorityLabel = (value: string) => {
    switch (value) {
      case "urgente": return "Urgente";
      case "alta": return "Alta";
      case "baja": return "Baja";
      default: return "Media";
    }
  };

  const getStatusLabel = (value: string) => {
    switch (value) {
      case "en_curso": return "En curso";
      case "hecha": return "Hecha";
      default: return "Pendiente";
    }
  };

  const visibleTasks = tasks.filter((task) =>
    (!search.trim() || (task.title + " " + (task.description ?? "")).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) &&
    (!statusFilter || task.status === statusFilter) &&
    (!priorityFilter || task.priority === priorityFilter) &&
    (!assigneeFilter || (assigneeFilter === "unassigned" ? !task.assigned_to : task.assigned_to === assigneeFilter))
  ).sort((a, b) => {
    const priorityRank: Record<string, number> = { urgente: 4, alta: 3, media: 2, baja: 1 };
    if (sortBy === "title") return a.title.localeCompare(b.title, "es");
    if (sortBy === "priority") return (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0) || a.title.localeCompare(b.title, "es");
    if (sortBy === "created") return b.created_at.localeCompare(a.created_at);
    return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || a.title.localeCompare(b.title, "es");
  });
  const selectedTask = tasks.find((task) => task.id === selectedId);
  const detailTaskId = selectedTask?.id;
  const detailState = taskStates.find((state) => state.value === selectedTask?.status);
  const detailBusy = saving || editSaving || commentSaving || attachmentWriting || completingId !== null;

  useEffect(() => {
    const dialog = detailRef.current;
    if (!detailTaskId || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [detailTaskId]);

  const closeTaskDetail = () => {
    if (detailBusy) return;
    detailRef.current?.close();
    setSelectedId(null);
    setError("");
    setNotice("");
  };
  const monthLabel = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(month);
  const offset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) =>
    new Date(month.getFullYear(), month.getMonth(), index - offset + 1));
  const withoutDate = visibleTasks.filter((task) => !task.due_date);

  const stateControl = (task: PanelTask, compact = false) => (
    <label className="block text-xs text-muted-foreground">
      <span className={compact ? "sr-only" : undefined}>Estado de {task.title}</span>
      <select className={input + (compact ? " px-2" : " mt-1")} value={task.status}
        disabled={!canUpdate(task) || saving || loading || completingId !== null}
        onChange={(event) => void handleStatusChange(task, event.target.value)}>
        {taskStates.map((state) => <option key={state.value} value={state.value}>{state.label}</option>)}
      </select>
      {!canUpdate(task) && <span className="mt-1 block">Solo lectura: no está asignada a vos.</span>}
    </label>
  );

  const taskTitle = (task: PanelTask) => (
    <button type="button" className="text-left text-base font-semibold leading-snug text-accent [overflow-wrap:anywhere] hover:underline"
      onClick={() => setSelectedId(task.id)}>{task.title}</button>
  );

  const taskDueDate = (task: PanelTask) => {
    const overdue = task.status !== "hecha" && task.due_date && task.due_date < getLocalDateString();
    return <span className={overdue ? "text-red-400" : undefined}>{formatDate(task.due_date)}</span>;
  };

  const taskActions = (task: PanelTask) => (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={btnGhost} disabled={!canUpdate(task) || completingId !== null || saving || loading}
        onClick={() => void handleCompleteTask(task)}>{completingId === task.id ? "Actualizando..." : task.status === "hecha" ? "Reabrir" : "Completar"}</button>
      {role === "admin" && <button type="button" className={btnGhost} disabled={completingId !== null || saving || loading}
        onClick={() => void handleDeleteTask(task)}>Eliminar</button>}
    </div>
  );

  const taskFeedback = (
    <>
      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <p role="status" aria-live="polite" className="mb-3 text-sm">{notice}</p>
    </>
  );

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
      {!selectedTask && taskFeedback}
      <div role="group" aria-label="Vista de tareas" className="mb-5 flex gap-2">
        <button type="button" className={btnGhost} aria-pressed={view === "lista"} onClick={() => setView("lista")}>Lista</button>
        <button type="button" className={btnGhost} aria-pressed={view === "kanban"} onClick={() => setView("kanban")}>Kanban</button>
        <button type="button" className={btnGhost} aria-pressed={view === "calendario"} onClick={() => setView("calendario")}>Calendario</button>
      </div>
      <div className="mb-5 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs text-muted-foreground">Buscar
          <input type="search" className={input + " mt-1"} value={search} placeholder="Asunto o descripción" onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="text-xs text-muted-foreground">Estado
          <select className={input + " mt-1"} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Todos</option>{taskStates.map((state) => <option key={state.value} value={state.value}>{state.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Prioridad
          <select className={input + " mt-1"} value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="">Todas</option>{["baja","media","alta","urgente"].map((value) => <option key={value} value={value}>{getPriorityLabel(value)}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Responsable
          <select className={input + " mt-1"} value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
            <option value="">Todos</option><option value="unassigned">Sin asignar</option>
            {Array.from(new Set([...profiles.map((profile) => profile.id), ...tasks.flatMap((task) => task.assigned_to ? [task.assigned_to] : [])])).map((id) =>
              <option key={id} value={id}>{getProfileName(id)}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Ordenar por
          <select className={input + " mt-1"} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="due">Vencimiento más próximo</option><option value="title">Asunto A–Z</option>
            <option value="priority">Mayor prioridad</option><option value="created">Más recientes</option>
          </select>
        </label>
        <button type="button" className={btnGhost} onClick={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); setAssigneeFilter(""); setSortBy("due"); }}>Limpiar filtros</button>
      </div>
      {selectedTask && (
        <dialog
          ref={detailRef}
          aria-labelledby="task-detail-title"
          onCancel={(event) => {
            event.preventDefault();
            closeTaskDetail();
          }}
          className="fixed inset-0 m-auto max-h-[90dvh] w-11/12 max-w-5xl overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/70"
        >
          <div className="p-4 sm:p-6">
            <header className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
              <div className="min-w-0 flex-1 basis-60">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Detalle de tarea</p>
                <h2 id="task-detail-title" className="break-words text-2xl font-semibold">{selectedTask.title}</h2>
                <span className={"mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold " + (detailState?.badge ?? "border-border text-muted-foreground")}>
                  {detailState?.label ?? "Estado desconocido"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnGhost} disabled={detailBusy} onClick={closeTaskDetail}>Cerrar detalle</button>
                {canUpdate(selectedTask) && !editing && <button type="button" className={btn} onClick={() => openTaskEdit(selectedTask)}>Editar tarea</button>}
              </div>
            </header>
            {taskFeedback}
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <section aria-label="Datos de la tarea" className="min-w-0">
                {editing ? (
                  <form className="space-y-4" onSubmit={saveTaskEdit}>
                    <label className="block text-sm">Título *<input className={input + " mt-1"} value={editTitle} onChange={e => setEditTitle(e.target.value)} required /></label>
                    <label className="block text-sm">Descripción<textarea className={input + " mt-1 min-h-28"} value={editDescription} onChange={e => setEditDescription(e.target.value)} /></label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm">Prioridad<select className={input + " mt-1"} value={editPriority} onChange={e => setEditPriority(e.target.value)}>{["baja","media","alta","urgente"].map(v => <option key={v} value={v}>{getPriorityLabel(v)}</option>)}</select></label>
                      <label className="block text-sm">Estado<select className={input + " mt-1"} value={editStatus} onChange={e => setEditStatus(e.target.value)}>{taskStates.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select></label>
                      <label className="block text-sm">Vencimiento<input type="date" lang="es-AR" className={input + " mt-1"} value={editDueDate} onChange={e => setEditDueDate(e.target.value)} /></label>
                      <label className="block text-sm">Responsable{role === "admin" ? <select className={input + " mt-1"} value={editAssignee} onChange={e => setEditAssignee(e.target.value)}><option value="">Sin asignar</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email || "Usuario"}</option>)}</select> : <span className="mt-1 block">{getProfileName(selectedTask.assigned_to)}</span>}</label>
                    </div>
                    <div className="flex flex-wrap gap-2"><button className={btn} type="submit" disabled={editSaving || !editTitle.trim()}>{editSaving ? "Guardando..." : "Guardar cambios"}</button><button className={btnGhost} type="button" disabled={editSaving} onClick={() => setEditing(false)}>Cancelar</button></div>
                  </form>
                ) : (
                  <>
                    <h3 className="mb-2 font-semibold">Descripción</h3>
                    <p className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background/40 p-4 text-sm">{selectedTask.description || "Sin descripción"}</p>
                    <dl className="my-4 grid gap-3 break-words rounded-lg border border-border p-4 text-sm sm:grid-cols-2">
                      <div><dt className="text-muted-foreground">Creador</dt><dd>{getProfileName(selectedTask.created_by)}</dd></div>
                      <div><dt className="text-muted-foreground">Responsable</dt><dd>{getProfileName(selectedTask.assigned_to)}</dd></div>
                      <div><dt className="text-muted-foreground">Prioridad</dt><dd>{getPriorityLabel(selectedTask.priority)}</dd></div>
                      <div><dt className="text-muted-foreground">Vencimiento</dt><dd>{formatDate(selectedTask.due_date)}</dd></div>
                      <div><dt className="text-muted-foreground">Creada</dt><dd>{formatDateTime(selectedTask.created_at)}</dd></div>
                      <div><dt className="text-muted-foreground">Finalizada</dt><dd>{selectedTask.completed_at ? formatDateTime(selectedTask.completed_at) : "Sin finalizar"}</dd></div>
                    </dl>
                    {stateControl(selectedTask)}
                  </>
                )}
              </section>
              <section aria-labelledby="task-notes-title" className="min-w-0 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <h3 id="task-notes-title" className="mb-3 font-semibold">Historial de notas ({comments.length})</h3>
                {commentsLoading && <p className="text-sm text-muted-foreground">Cargando notas...</p>}
                {commentsError && <p role="alert" className="mb-3 text-sm text-red-400">{commentsError}</p>}
                {!commentsLoading && comments.length === 0 && <p className="mb-4 text-sm text-muted-foreground">Todavía no hay notas para esta tarea.</p>}
                <div className="space-y-3">{comments.map(comment => <article key={comment.id} className="rounded-lg border border-border p-3"><div className="mb-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{getProfileName(comment.author_id)}</span><time dateTime={comment.created_at}>{formatDateTime(comment.created_at)}</time></div><p className="whitespace-pre-wrap break-words text-sm">{comment.content}</p></article>)}</div>
                <form className="mt-4 space-y-3" onSubmit={addTaskComment}><label className="block text-sm">Nueva nota<textarea className={input + " mt-1 min-h-24"} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Escribí una actualización o comentario..." required /></label><button className={btn} type="submit" disabled={commentSaving || commentsLoading || !commentText.trim()}>{commentSaving ? "Publicando..." : "Agregar nota"}</button></form>
              </section>
            </div>
            {role === "admin" && (
              <TaskAttachments key={selectedTask.id} taskId={selectedTask.id} onWriteBusyChange={setAttachmentWriting} />
            )}
          </div>
        </dialog>
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
            <h2 className="mt-1 text-xl font-semibold">Crear tarea</h2>
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
                onChange={(event) => setDescription(event.target.value)}
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
                  onChange={(event) => setAssignedTo(event.target.value)}
                  className={input}
                >
                  <option value="">Sin asignar</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email || "Usuario"}
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
                onChange={(event) => setPriority(event.target.value)}
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
                onChange={(event) => setStatus(event.target.value)}
                className={input}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_curso">En curso</option>
                <option value="hecha">Hecha</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Fecha límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={input}
              />
            </div>
          </div>

          {role === "admin" && (
            <label className="mt-5 block text-sm">
              <span className="font-medium">Adjunto privado (opcional, hasta 10 MiB)</span>
              <input type="file" ref={newTaskFileRef} disabled={saving} className={input + " mt-2"}
                onChange={(event) => {
                  const field = event.currentTarget;
                  const file = field.files?.[0];
                  field.setCustomValidity(file && !isValidTaskAttachment(file) ? invalidAttachmentMessage : "");
                  if (!field.validity.valid) field.reportValidity();
                }} />
            </label>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className={btnGhost}
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={btn}>
              {saving ? "Guardando..." : "Guardar tarea"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">{view === "lista" ? "Lista de tareas" : view === "calendario" ? "Calendario de vencimientos" : "Tablero Kanban"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {visibleTasks.length} de {tasks.length} tareas
            </p>
          </div>
          <button
            type="button"
            onClick={loadTasks}
            disabled={loading || saving || completingId !== null}
            className={btnGhost}
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Cargando tareas...
          </div>
        ) : loadFailed ? (
          <p className="p-8 text-center text-sm text-muted-foreground">La carga falló. Usá Actualizar para volver a intentarlo.</p>
        ) : view === "calendario" ? (
          <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 aria-live="polite" className="font-semibold capitalize">{monthLabel}</h3>
              <div className="flex gap-2">
                <button type="button" className={btnGhost} aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>Anterior</button>
                <button type="button" className={btnGhost} onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Hoy</button>
                <button type="button" className={btnGhost} aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Siguiente</button>
              </div>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">Las tareas se ubican por su fecha de vencimiento. Seleccioná un asunto para ver el detalle.</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] table-fixed border-collapse text-sm">
                <caption className="sr-only">Vencimientos de {monthLabel}</caption>
                <thead><tr>{["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((day) => <th scope="col" key={day} className="border border-border p-2">{day}</th>)}</tr></thead>
                <tbody>{Array.from({ length: calendarDays.length / 7 }, (_, week) => (
                  <tr key={week}>{calendarDays.slice(week * 7, week * 7 + 7).map((day) => {
                    const date = getLocalDateString(day);
                    const dayTasks = visibleTasks.filter((task) => task.due_date === date);
                    return <td key={date} className={"h-28 border border-border p-2 align-top " + (day.getMonth() !== month.getMonth() ? "bg-background/50 text-muted-foreground" : "")}>
                      <time dateTime={date} aria-current={date === getLocalDateString() ? "date" : undefined}
                        className={date === getLocalDateString() ? "rounded bg-accent/20 px-1 font-bold text-accent" : ""}>{day.getDate()}</time>
                      <div className="mt-2 space-y-1">{dayTasks.map((task) =>
                        <button key={task.id} type="button" className={"block w-full rounded border border-border p-1 text-left text-xs hover:border-accent " + (task.status === "hecha" ? "text-muted-foreground line-through" : "text-accent")}
                          onClick={() => setSelectedId(task.id)}>{task.title}<span className="block text-[10px]">{getStatusLabel(task.status)}</span></button>)}</div>
                    </td>;
                  })}</tr>
                ))}</tbody>
              </table>
            </div>
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold">Sin fecha ({withoutDate.length})</h3>
              <div className="flex flex-wrap gap-2">{withoutDate.map((task) =>
                <button type="button" key={task.id} className={btnGhost} onClick={() => setSelectedId(task.id)}>{task.title}</button>)}</div>
              {withoutDate.length === 0 && <p className="text-xs text-muted-foreground">No hay tareas sin fecha para estos filtros.</p>}
            </div>
          </div>
        ) : view === "kanban" ? (
          <div className="p-4">
            <p className="mb-4 text-sm text-muted-foreground">Arrastrá una tarjeta a otra columna o usá su selector de estado.</p>
            <div className="grid gap-4 xl:grid-cols-3">
              {taskStates.map((state) => {
                const columnTasks = visibleTasks.filter((task) => task.status === state.value);
                return (
                  <section key={state.value} aria-label={state.label}
                    className={"min-w-0 rounded-xl border p-3 " + (draggedId ? "border-accent bg-accent/5" : "border-border bg-background/40")}
                    onDragOver={(event) => {
                      if (draggedId && !lock.current) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const task = tasks.find((item) => item.id === draggedId);
                      setDraggedId(null);
                      if (task) void handleStatusChange(task, state.value);
                    }}>
                    <h3 className="mb-4 flex justify-between font-semibold">{state.label}<span>{columnTasks.length}</span></h3>
                    <div className="space-y-3">
                      {columnTasks.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Sin tareas</p>}
                      {columnTasks.map((task) => (
                        <article key={task.id} draggable={canUpdate(task) && !saving && completingId === null}
                          onDragStart={(event) => {
                            if (!canUpdate(task) || lock.current) { event.preventDefault(); return; }
                            event.dataTransfer.setData("text/plain", task.id);
                            event.dataTransfer.effectAllowed = "move";
                            setDraggedId(task.id);
                          }}
                          onDragEnd={() => setDraggedId(null)}
                          aria-busy={completingId === task.id}
                          className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4">
                          <h4 className="break-words font-semibold"><button type="button" className="text-left hover:text-accent" onClick={() => setSelectedId(task.id)}>{task.title}</button></h4>
                          {task.description && (
                            <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                          <p className="text-xs text-accent">Prioridad: {getPriorityLabel(task.priority)}</p>
                          <p className="break-words text-xs text-muted-foreground">Responsable: {getProfileName(task.assigned_to)}</p>
                          <p className="text-xs text-muted-foreground">Vencimiento: {formatDate(task.due_date)}</p>
                          {task.completed_at && <p className="text-xs text-muted-foreground">Finalizada: {formatDateTime(task.completed_at)}</p>}
                          {stateControl(task)}
                          {completingId === task.id && <p role="status" className="text-xs">Actualizando...</p>}
                          {role === "admin" && <button type="button" className={btnGhost}
                            disabled={saving || completingId !== null}
                            onClick={() => void handleDeleteTask(task)}>Eliminar</button>}
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mb-3 text-3xl">✓</div>
            <h3 className="font-semibold">No hay tareas todavía</h3>
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
          <>
            <table className="hidden w-full table-fixed text-left text-sm xl:table">
              <caption className="sr-only">Listado de tareas filtradas</caption>
              <thead className="bg-background/50 text-xs text-muted-foreground">
                <tr>
                  {taskListColumns.map(({ label, width }) => (
                    <th key={label} scope="col" className={"px-3 py-3 " + width}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleTasks.length === 0 && <tr><td colSpan={taskListColumns.length} className="p-8 text-center text-muted-foreground">No hay tareas para estos filtros.</td></tr>}
                {visibleTasks.map((task) => (
                  <tr key={task.id} className={task.status === "hecha" ? "bg-green-500/5" : "hover:bg-accent/5"}>
                    <td className="px-3 py-4">{taskTitle(task)}</td>
                    <td className="px-3 py-4 [overflow-wrap:anywhere]">{task.created_by ? getProfileName(task.created_by) : "Sin usuario"}</td>
                    <td className="px-3 py-4 [overflow-wrap:anywhere]">{getProfileName(task.assigned_to)}</td>
                    <td className="px-3 py-4">{getPriorityLabel(task.priority)}</td>
                    <td className="px-3 py-4">{stateControl(task, true)}</td>
                    <td className="px-3 py-4 [overflow-wrap:anywhere]">{taskDueDate(task)}</td>
                    <td className="px-3 py-4">{taskActions(task)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="xl:hidden">
              {visibleTasks.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No hay tareas para estos filtros.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {visibleTasks.map((task) => (
                    <li key={task.id} className="space-y-4 p-4">
                      <h3>{taskTitle(task)}</h3>
                      <dl className="grid gap-3 text-sm [overflow-wrap:anywhere] sm:grid-cols-2">
                        <div><dt className="text-muted-foreground">Creador</dt><dd>{task.created_by ? getProfileName(task.created_by) : "Sin usuario"}</dd></div>
                        <div><dt className="text-muted-foreground">Responsable</dt><dd>{getProfileName(task.assigned_to)}</dd></div>
                        <div><dt className="text-muted-foreground">Prioridad</dt><dd>{getPriorityLabel(task.priority)}</dd></div>
                        <div><dt className="text-muted-foreground">Vencimiento</dt><dd>{taskDueDate(task)}</dd></div>
                      </dl>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="w-40 max-w-full">
                          <p className="mb-1 text-xs text-muted-foreground">Estado</p>
                          {stateControl(task, true)}
                        </div>
                        {taskActions(task)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </ModuleHeader>
  );
}

/* =========================================================
   MÓDULO GASTOS
   ========================================================= */

function ExpensesModule() {
  const [expenses, setExpenses] = useState<PanelExpense[]>([]);
  const [clients, setClients] = useState<Pick<PanelClient, "id" | "name">[]>([]);
  const [profiles, setProfiles] = useState<PanelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PanelExpense | null>(null);
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("todas");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");

  const today = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [spentOn, setSpentOn] = useState(today);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [clientId, setClientId] = useState("");
  const [active, setActive] = useState(true);

  const loadExpenses = async () => {
    setLoading(true);
    setError("");
    try {
      const [expensesResult, clientsResult, profilesResult] = await Promise.all([
        supabase.from("expenses")
          .select("id,spent_on,amount,currency,category,description,vendor,client_id,active,created_by,created_at,updated_at")
          .order("spent_on", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase.from("clients").select("id,name").order("name", { ascending: true }),
        supabase.from("profiles").select("id,email,full_name").order("full_name", { ascending: true }),
      ]);
      if (expensesResult.error) throw expensesResult.error;
      if (clientsResult.error) throw clientsResult.error;
      if (profilesResult.error) throw profilesResult.error;
      setExpenses((expensesResult.data ?? []) as PanelExpense[]);
      setClients((clientsResult.data ?? []) as Pick<PanelClient, "id" | "name">[]);
      setProfiles((profilesResult.data ?? []) as PanelProfile[]);
    } catch (loadError) {
      console.error("Error cargando gastos:", loadError);
      setError(loadError instanceof Error ? loadError.message : "No pudimos cargar los gastos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, []);

  const resetForm = () => {
    setEditingExpense(null);
    setSpentOn(today());
    setAmount("");
    setCurrency("ARS");
    setCategory("");
    setDescription("");
    setVendor("");
    setClientId("");
    setActive(true);
  };

  const openNew = () => {
    setError("");
    resetForm();
    setShowForm(true);
  };

  const openEdit = (expense: PanelExpense) => {
    setError("");
    setEditingExpense(expense);
    setSpentOn(expense.spent_on);
    setAmount(String(expense.amount));
    setCurrency(expense.currency);
    setCategory(expense.category);
    setDescription(expense.description ?? "");
    setVendor(expense.vendor ?? "");
    setClientId(expense.client_id ?? "");
    setActive(expense.active);
    setShowForm(true);
  };

  const saveExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!spentOn || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Ingresá una fecha y un importe mayor a cero.");
      return;
    }
    if (!currency.trim() || !category.trim()) {
      setError("La moneda y la categoría son obligatorias.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        spent_on: spentOn,
        amount: numericAmount,
        currency: currency.trim().toUpperCase(),
        category: category.trim(),
        description: description.trim() || null,
        vendor: vendor.trim() || null,
        client_id: clientId || null,
        active,
      };
      if (editingExpense) {
        const { error: updateError } = await supabase.from("expenses")
          .update(payload).eq("id", editingExpense.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("expenses").insert(payload);
        if (insertError) throw insertError;
      }
      setShowForm(false);
      resetForm();
      await loadExpenses();
    } catch (saveError) {
      console.error("Error guardando gasto:", saveError);
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar el gasto.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (expense: PanelExpense) => {
    setProcessingId(expense.id);
    setError("");
    try {
      const { error: updateError } = await supabase.from("expenses")
        .update({ active: !expense.active }).eq("id", expense.id);
      if (updateError) throw updateError;
      await loadExpenses();
    } catch (toggleError) {
      console.error("Error actualizando gasto:", toggleError);
      setError(toggleError instanceof Error ? toggleError.message : "No pudimos actualizar el gasto.");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteExpense = async (expense: PanelExpense) => {
    if (!window.confirm(`¿Querés eliminar el gasto de ${expense.currency} ${formatAmount(Number(expense.amount), expense.currency)}? Esta acción no se puede deshacer.`)) return;
    setProcessingId(expense.id);
    setError("");
    try {
      const { error: deleteError } = await supabase.from("expenses")
        .delete().eq("id", expense.id);
      if (deleteError) throw deleteError;
      await loadExpenses();
    } catch (deleteError) {
      console.error("Error eliminando gasto:", deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "No pudimos eliminar el gasto.");
    } finally {
      setProcessingId(null);
    }
  };

  const clientName = (id: string | null) =>
    id ? clients.find((client) => client.id === id)?.name ?? "Cliente no disponible" : "Sin cliente";
  const creatorName = (id: string | null) => {
    if (!id) return "Sin usuario";
    const profile = profiles.find((item) => item.id === id);
    return profile?.full_name || profile?.email || "Usuario no disponible";
  };

  const currencies = [...new Set(expenses.map((expense) => expense.currency))].sort();
  const categories = [...new Set(expenses.map((expense) => expense.category))].sort();
  const normalizedSearch = search.trim().toLowerCase();
  const filteredExpenses = expenses.filter((expense) => {
    if (currencyFilter !== "todas" && expense.currency !== currencyFilter) return false;
    if (categoryFilter !== "todas" && expense.category !== categoryFilter) return false;
    if (statusFilter === "activos" && !expense.active) return false;
    if (statusFilter === "inactivos" && expense.active) return false;
    return !normalizedSearch || [
      expense.category, expense.description, expense.vendor,
      clientName(expense.client_id), creatorName(expense.created_by),
    ].some((value) => (value ?? "").toLowerCase().includes(normalizedSearch));
  });
  const activeCount = expenses.filter((expense) => expense.active).length;
  const totals = expenses.filter((expense) => expense.active).reduce<Record<string, number>>((acc, expense) => {
    acc[expense.currency] = (acc[expense.currency] ?? 0) + Number(expense.amount);
    return acc;
  }, {});

  return (
    <ModuleHeader eyebrow="// GASTOS" title="Gastos"
      description="Registro y administración de gastos internos."
      actionLabel="Nuevo gasto" onAction={openNew}>
      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Gastos registrados</p>
          <p className="mt-2 text-2xl font-semibold">{expenses.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Activos / inactivos</p>
          <p className="mt-2 text-2xl font-semibold">{activeCount} / {expenses.length - activeCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total activo por moneda</p>
          {Object.entries(totals).length === 0 ? <p className="mt-2 text-sm">Sin gastos activos</p> :
            Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)).map(([code, total]) => (
              <p key={code} className="mt-1 font-semibold">{code} {formatAmount(total, code)}</p>
            ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={saveExpense} className="mb-6 rounded-xl border border-border bg-card p-6">
          <p className="text-sm font-medium tracking-wide text-accent">{editingExpense ? "// EDITAR GASTO" : "// NUEVO GASTO"}</p>
          <h2 className="mb-6 mt-1 text-xl font-semibold">{editingExpense ? "Editar gasto" : "Registrar gasto"}</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div><label className="mb-2 block text-sm font-medium">Fecha *</label>
              <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} className={input} required /></div>
            <div><label className="mb-2 block text-sm font-medium">Importe *</label>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={input} required /></div>
            <div><label className="mb-2 block text-sm font-medium">Moneda *</label>
              <input type="text" maxLength={10} value={currency} onChange={(e) => setCurrency(e.target.value)} className={input} placeholder="ARS, USD..." required /></div>
            <div><label className="mb-2 block text-sm font-medium">Categoría *</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={input} placeholder="Ej.: Servicios" required /></div>
            <div><label className="mb-2 block text-sm font-medium">Proveedor</label>
              <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className={input} /></div>
            <div><label className="mb-2 block text-sm font-medium">Cliente relacionado</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={input}>
                <option value="">Sin cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select></div>
            <div><label className="mb-2 block text-sm font-medium">Estado</label>
              <select value={active ? "activo" : "inactivo"} onChange={(e) => setActive(e.target.value === "activo")} className={input}>
                <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
              </select></div>
            <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium">Descripción</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${input} min-h-24 resize-y`} /></div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} disabled={saving} className={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} className={btn}>{saving ? "Guardando..." : editingExpense ? "Guardar cambios" : "Guardar gasto"}</button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-semibold">Lista de gastos</h2><p className="mt-1 text-xs text-muted-foreground">{filteredExpenses.length} mostrados</p></div>
            <button type="button" onClick={() => void loadExpenses()} disabled={loading} className={btnGhost}>{loading ? "Actualizando..." : "Actualizar"}</button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} className={input} placeholder="Buscar gastos..." />
            <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)} className={input}>
              <option value="todas">Todas las monedas</option>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={input}>
              <option value="todas">Todas las categorías</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={input}>
              <option value="todos">Todos los estados</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Cargando gastos...</p> :
          filteredExpenses.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No hay gastos para mostrar.</p> :
          <div className="divide-y divide-border">{filteredExpenses.map((expense) => (
            <div key={expense.id} className={`p-5 ${expense.active ? "" : "opacity-60"}`}>
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{expense.category}</h3>
                    <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{expense.active ? "Activo" : "Inactivo"}</span>
                    <span className="font-semibold text-accent">{expense.currency} {formatAmount(Number(expense.amount), expense.currency)}</span>
                  </div>
                  {expense.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{expense.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span>📅 {formatDate(expense.spent_on)}</span>
                    <span>Proveedor: {expense.vendor || "Sin proveedor"}</span>
                    <span>Cliente: {clientName(expense.client_id)}</span>
                    <span>Registrado por: {creatorName(expense.created_by)}</span>
                    <span>Alta: {formatDateTime(expense.created_at)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => void toggleActive(expense)} disabled={processingId === expense.id} className={btnGhost}>{expense.active ? "Desactivar" : "Activar"}</button>
                  <button type="button" onClick={() => openEdit(expense)} disabled={processingId === expense.id} className={btnGhost}>Editar</button>
                  <button type="button" onClick={() => void deleteExpense(expense)} disabled={processingId === expense.id} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50">Eliminar</button>
                </div>
              </div>
            </div>
          ))}</div>}
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
  const [editingClient, setEditingClient] = useState<PanelClient | null>(null);
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
        .order("active", { ascending: false })
        .order("name", { ascending: true });

      if (loadError) throw loadError;
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
    if (role !== "admin") return;
    setError("");
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (client: PanelClient) => {
    if (role !== "admin") return;
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
    if (saving) return;
    setShowForm(false);
    resetForm();
  };

  const handleSaveClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== "admin") return;

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
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("clients")
          .insert(payload);
        if (insertError) throw insertError;
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
    if (role !== "admin") return;
    setProcessingId(client.id);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("clients")
        .update({ active: !client.active })
        .eq("id", client.id);
      if (updateError) throw updateError;
      await loadClients();
    } catch (toggleError) {
      console.error("Error cambiando estado del cliente:", toggleError);
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
    if (role !== "admin") return;

    const confirmed = window.confirm(
      `¿Querés eliminar el cliente "${client.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setProcessingId(client.id);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id);
      if (deleteError) throw deleteError;
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
    if (statusFilter === "activos" && !client.active) return false;
    if (statusFilter === "inactivos" && client.active) return false;
    if (!normalizedSearch) return true;

    return [
      client.name,
      client.company,
      client.email,
      client.phone,
      client.notes,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const activeCount = clients.filter((client) => client.active).length;
  const inactiveCount = clients.length - activeCount;

  return (
    <ModuleHeader
      eyebrow="// CLIENTES"
      title="Clientes"
      description={
        role === "admin"
          ? "Administración y seguimiento de clientes."
          : "Consulta de clientes."
      }
      actionLabel={role === "admin" ? "Nuevo cliente" : undefined}
      onAction={handleOpenNew}
    >
      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="mt-2 text-2xl font-semibold">{clients.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clientes registrados
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="mt-2 text-2xl font-semibold text-green-400">
            {activeCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clientes activos
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Inactivos</p>
          <p className="mt-2 text-2xl font-semibold">{inactiveCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clientes desactivados
          </p>
        </div>
      </div>

      {showForm && role === "admin" && (
        <form
          onSubmit={handleSaveClient}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-6">
            <p className="text-sm font-medium tracking-wide text-accent">
              {editingClient ? "// EDITAR CLIENTE" : "// NUEVO CLIENTE"}
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {editingClient ? "Editar cliente" : "Crear cliente"}
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
                onChange={(event) => setName(event.target.value)}
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
                onChange={(event) => setCompany(event.target.value)}
                className={input}
                placeholder="Empresa o razón social"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setPhone(event.target.value)}
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
                  setActive(event.target.value === "activo")
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
                onChange={(event) => setNotes(event.target.value)}
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
            <button type="submit" disabled={saving} className={btn}>
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
              <h2 className="font-semibold">Lista de clientes</h2>
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
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={input}
              placeholder="Buscar por nombre, empresa, email, teléfono o notas..."
            />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "todos" | "activos" | "inactivos",
                )
              }
              className={`${input} md:w-44`}
            >
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Cargando clientes...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mb-3 text-3xl">👥</div>
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
            {clients.length === 0 && role === "admin" && (
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
                  client.active ? "hover:bg-background/30" : "opacity-60"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{client.name}</h3>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          client.active
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {client.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    {client.company && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {client.company}
                      </p>
                    )}

                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      {client.email && (
                        <span className="truncate">✉️ {client.email}</span>
                      )}
                      {client.phone && <span>📞 {client.phone}</span>}
                      <span>
                        📅 Alta: {formatDateTime(client.created_at)}
                      </span>
                      {client.updated_at !== client.created_at && (
                        <span>
                          🔄 Actualizado: {formatDateTime(client.updated_at)}
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

                  {role === "admin" && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(client)}
                        disabled={processingId === client.id}
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
                        onClick={() => handleOpenEdit(client)}
                        disabled={processingId === client.id}
                        className={btnGhost}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClient(client)}
                        disabled={processingId === client.id}
                        className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
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
  const [leads, setLeads] = useState<PanelLead[]>([]);
  const [profiles, setProfiles] = useState<PanelProfile[]>([]);
  const [clients, setClients] = useState<
    Pick<PanelClient, "id" | "name">[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<PanelLead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [activeFilter, setActiveFilter] = useState<
    "todos" | "activos" | "inactivos"
  >("activos");

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<PanelLead["status"]>("nuevo");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);
  const [wonByUserId, setWonByUserId] = useState("");

  const loadLeads = async () => {
    setLoading(true);
    setError("");

    try {
      const [leadsResult, profilesResult, clientsResult] = await Promise.all([
        supabase
          .from("leads")
          .select(
            "id,name,company,email,phone,source,status,next_follow_up,notes,converted_client_id,won_by_user_id,won_by_name,won_at,converted_by_user_id,converted_by_name,converted_at,active,created_by,created_at,updated_at",
          )
          .order("active", { ascending: false })
          .order("next_follow_up", {
            ascending: true,
            nullsFirst: false,
          })
          .order("created_at", { ascending: false }),

        supabase
          .from("profiles")
          .select("id,email,full_name")
          .order("full_name", { ascending: true, nullsFirst: false }),

        supabase
          .from("clients")
          .select("id,name")
          .order("name", { ascending: true }),
      ]);

      if (leadsResult.error) throw leadsResult.error;
      if (profilesResult.error) throw profilesResult.error;
      if (clientsResult.error) throw clientsResult.error;

      setLeads((leadsResult.data ?? []) as PanelLead[]);
      setProfiles((profilesResult.data ?? []) as PanelProfile[]);
      setClients(
        (clientsResult.data ?? []) as Pick<PanelClient, "id" | "name">[],
      );
    } catch (loadError) {
      console.error("Error cargando prospectos:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar los prospectos.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const getProfileNameById = (profileId: string | null) => {
    if (!profileId) return null;
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile) return null;
    return profile.full_name || profile.email || null;
  };

  const resetForm = () => {
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setSource("");
    setStatus("nuevo");
    setNextFollowUp("");
    setNotes("");
    setActive(true);
    setWonByUserId("");
    setEditingLead(null);
  };

  const handleOpenNew = () => {
    if (role !== "admin") return;
    setError("");
    setSuccess("");
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (lead: PanelLead) => {
    if (role !== "admin") return;
    setError("");
    setSuccess("");
    setEditingLead(lead);
    setName(lead.name);
    setCompany(lead.company ?? "");
    setEmail(lead.email ?? "");
    setPhone(lead.phone ?? "");
    setSource(lead.source ?? "");
    setStatus(lead.status);
    setNextFollowUp(lead.next_follow_up ?? "");
    setNotes(lead.notes ?? "");
    setActive(lead.active);
    setWonByUserId(lead.won_by_user_id ?? "");
    setShowForm(true);
  };

  const handleCancel = () => {
    if (saving) return;
    setShowForm(false);
    resetForm();
  };

  const handleSaveLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== "admin") return;

    const cleanName = name.trim();
    if (!cleanName) {
      setError("El nombre del prospecto es obligatorio.");
      return;
    }

    if (status === "ganado" && !wonByUserId) {
      setError(
        "Para marcar un prospecto como Ganado, seleccioná el vendedor responsable.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: cleanName,
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        source: source.trim() || null,
        status,
        next_follow_up: nextFollowUp || null,
        notes: notes.trim() || null,
        active,
        won_by_user_id:
          status === "ganado"
            ? wonByUserId
            : editingLead?.won_by_user_id ?? null,
        updated_at: new Date().toISOString(),
      };

      if (editingLead) {
        const { error: updateError } = await supabase
          .from("leads")
          .update(payload)
          .eq("id", editingLead.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("leads")
          .insert(payload);
        if (insertError) throw insertError;
      }

      setShowForm(false);
      resetForm();
      setSuccess(
        editingLead
          ? "Los cambios del prospecto se guardaron correctamente."
          : "El prospecto se creó correctamente.",
      );
      await loadLeads();
    } catch (saveError) {
      console.error("Error guardando prospecto:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar el prospecto.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (lead: PanelLead) => {
    if (role !== "admin") return;
    setProcessingId(lead.id);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          active: !lead.active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (updateError) throw updateError;
      setSuccess(
        lead.active
          ? "El prospecto fue desactivado."
          : "El prospecto fue activado.",
      );
      await loadLeads();
    } catch (toggleError) {
      console.error("Error cambiando estado del prospecto:", toggleError);
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "No pudimos cambiar el estado del prospecto.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteLead = async (lead: PanelLead) => {
    if (role !== "admin") return;

    const confirmed = window.confirm(
      `¿Querés eliminar el prospecto "${lead.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setProcessingId(lead.id);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("leads")
        .delete()
        .eq("id", lead.id);

      if (deleteError) throw deleteError;
      setSuccess("El prospecto fue eliminado.");
      await loadLeads();
    } catch (deleteError) {
      console.error("Error eliminando prospecto:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No pudimos eliminar el prospecto.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleConvertLead = async (lead: PanelLead) => {
    if (role !== "admin") return;

    if (lead.converted_client_id) {
      setError("Este prospecto ya fue convertido anteriormente.");
      return;
    }

    if (lead.status !== "ganado") {
      setError(
        "Para convertir un prospecto, primero debe estar en estado Ganado.",
      );
      return;
    }

    if (!lead.won_by_user_id) {
      setError(
        "Este prospecto no tiene un vendedor responsable. Editalo y asigná quién ganó el cliente.",
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Convertir "${lead.name}" en cliente?\n\nSe creará un cliente con sus datos actuales. Esta acción no se ejecuta automáticamente y quedará vinculada al prospecto.`,
    );
    if (!confirmed) return;

    setProcessingId(lead.id);
    setError("");
    setSuccess("");

    try {
      const { data: clientId, error: conversionError } =
        await supabase.rpc("convert_lead_to_client", {
          p_lead_id: lead.id,
        });

      if (conversionError) throw conversionError;
      if (!clientId) {
        throw new Error(
          "La conversión no devolvió el identificador del cliente.",
        );
      }

      setSuccess(
        `El prospecto "${lead.name}" se convirtió correctamente en cliente.`,
      );
      await loadLeads();
    } catch (conversionError) {
      console.error("Error convirtiendo prospecto:", conversionError);
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "No pudimos convertir el prospecto en cliente.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredLeads = leads.filter((lead) => {
    if (activeFilter === "activos" && !lead.active) return false;
    if (activeFilter === "inactivos" && lead.active) return false;
    if (statusFilter !== "todos" && lead.status !== statusFilter) {
      return false;
    }
    if (!normalizedSearch) return true;

    return [
      lead.name,
      lead.company,
      lead.email,
      lead.phone,
      lead.source,
      lead.notes,
      lead.won_by_name,
      lead.converted_by_name,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const activeLeads = leads.filter((lead) => lead.active);
  const inactiveCount = leads.length - activeLeads.length;
  const inProgressCount = activeLeads.filter((lead) =>
    ["contactado", "propuesta"].includes(lead.status),
  ).length;
  const today = getLocalDateString();
  const followUpsDue = activeLeads.filter(
    (lead) => lead.next_follow_up && lead.next_follow_up <= today,
  ).length;

  const statusLabel = (value: PanelLead["status"]) => {
    switch (value) {
      case "contactado": return "Contactado";
      case "propuesta": return "Propuesta";
      case "ganado": return "Ganado";
      case "perdido": return "Perdido";
      default: return "Nuevo";
    }
  };

  const statusClass = (value: PanelLead["status"]) => {
    switch (value) {
      case "ganado":
        return "border-green-500/30 bg-green-500/10 text-green-400";
      case "perdido":
        return "border-red-500/30 bg-red-500/10 text-red-400";
      case "propuesta":
        return "border-accent/30 bg-accent/10 text-accent";
      default:
        return "border-border text-muted-foreground";
    }
  };

  return (
    <ModuleHeader
      eyebrow="// PROSPECTOS"
      title="Prospectos"
      description={
        role === "admin"
          ? "Administración y seguimiento de oportunidades comerciales."
          : "Consulta de prospectos y oportunidades comerciales."
      }
      actionLabel={role === "admin" ? "Nuevo prospecto" : undefined}
      onAction={handleOpenNew}
    >
      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="mt-2 text-2xl font-semibold">{leads.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Prospectos registrados
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="mt-2 text-2xl font-semibold text-green-400">
            {activeLeads.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            En seguimiento
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">En progreso</p>
          <p className="mt-2 text-2xl font-semibold">{inProgressCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Contactados o con propuesta
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Seguimientos pendientes
          </p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              followUpsDue > 0 ? "text-amber-400" : ""
            }`}
          >
            {followUpsDue}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Para hoy o fechas anteriores
          </p>
        </div>
      </div>

      {inactiveCount > 0 && (
        <p className="mb-5 text-xs text-muted-foreground">
          También hay {inactiveCount}{" "}
          {inactiveCount === 1
            ? "prospecto inactivo"
            : "prospectos inactivos"}{" "}
          en el registro.
        </p>
      )}

      {showForm && role === "admin" && (
        <form
          onSubmit={handleSaveLead}
          className="mb-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-6">
            <p className="text-sm font-medium tracking-wide text-accent">
              {editingLead ? "// EDITAR PROSPECTO" : "// NUEVO PROSPECTO"}
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {editingLead ? "Editar prospecto" : "Crear prospecto"}
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
                onChange={(event) => setName(event.target.value)}
                className={input}
                placeholder="Nombre del contacto"
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
                onChange={(event) => setCompany(event.target.value)}
                className={input}
                placeholder="Empresa o razón social"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={input}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={input}
                placeholder="+54 11 ..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Origen
              </label>
              <input
                type="text"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className={input}
                placeholder="Ej.: Web, referido, redes sociales..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Estado
              </label>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as PanelLead["status"])
                }
                className={input}
              >
                <option value="nuevo">Nuevo</option>
                <option value="contactado">Contactado</option>
                <option value="propuesta">Propuesta</option>
                <option value="ganado">Ganado</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>

            {status === "ganado" && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Vendedor responsable *
                </label>
                <select
                  value={wonByUserId}
                  onChange={(event) => setWonByUserId(event.target.value)}
                  className={input}
                  required
                >
                  <option value="">Seleccionar vendedor</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email || "Usuario"}
                    </option>
                  ))}
                </select>
                {profiles.length === 0 && (
                  <p className="mt-2 text-xs text-amber-400">
                    No se encontraron usuarios registrados para seleccionar.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Seleccioná quién consiguió cerrar esta oportunidad. Puede
                  ser distinto del administrador que registra el cambio.
                </p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Próximo seguimiento
              </label>
              <input
                type="date"
                value={nextFollowUp}
                onChange={(event) => setNextFollowUp(event.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Estado del registro
              </label>
              <select
                value={active ? "activo" : "inactivo"}
                onChange={(event) =>
                  setActive(event.target.value === "activo")
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
                onChange={(event) => setNotes(event.target.value)}
                className={`${input} min-h-28 resize-y`}
                placeholder="Detalles de conversaciones, necesidades, acuerdos..."
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
            <button type="submit" disabled={saving} className={btn}>
              {saving
                ? "Guardando..."
                : editingLead
                  ? "Guardar cambios"
                  : "Guardar prospecto"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">Lista de prospectos</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {filteredLeads.length === 1
                  ? "1 prospecto mostrado"
                  : `${filteredLeads.length} prospectos mostrados`}
              </p>
            </div>
            <button
              type="button"
              onClick={loadLeads}
              disabled={loading}
              className={btnGhost}
            >
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={input}
              placeholder="Buscar nombre, empresa, email, teléfono, origen o notas..."
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={input}
            >
              <option value="todos">Todos los estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="contactado">Contactado</option>
              <option value="propuesta">Propuesta</option>
              <option value="ganado">Ganado</option>
              <option value="perdido">Perdido</option>
            </select>
            <select
              value={activeFilter}
              onChange={(event) =>
                setActiveFilter(
                  event.target.value as "todos" | "activos" | "inactivos",
                )
              }
              className={input}
            >
              <option value="activos">Prospectos activos</option>
              <option value="inactivos">Prospectos inactivos</option>
              <option value="todos">Todos los registros</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Cargando prospectos...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mb-3 text-3xl">🎯</div>
            <h3 className="font-semibold">
              {leads.length === 0
                ? "No hay prospectos todavía"
                : "No encontramos prospectos"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {leads.length === 0
                ? "Creá el primer prospecto para comenzar el seguimiento comercial."
                : "Probá con otro término de búsqueda o cambiá los filtros."}
            </p>
            {leads.length === 0 && role === "admin" && (
              <button
                type="button"
                onClick={handleOpenNew}
                className={`${btn} mt-5`}
              >
                + Nuevo prospecto
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLeads.map((lead) => {
              const linkedClient = clients.find(
                (client) => client.id === lead.converted_client_id,
              );
              const winnerProfile = profiles.find(
                (item) => item.id === lead.won_by_user_id,
              );
              const winnerName =
              winnerProfile?.full_name?.trim() ||
              `SIN NOMBRE - ${winnerProfile?.email || lead.won_by_name || "SIN USUARIO"}`;

              const converterName =
                lead.converted_by_name ||
                getProfileNameById(lead.converted_by_user_id) ||
                "Usuario sin nombre";

              const hasWinnerHistory = Boolean(
                lead.won_by_user_id || lead.won_by_name || lead.won_at,
              );

              const hasConversionHistory = Boolean(
                lead.converted_client_id ||
                  lead.converted_by_user_id ||
                  lead.converted_by_name ||
                  lead.converted_at,
              );

              return (
                <div
                  key={lead.id}
                  className={`p-5 transition ${
                    lead.active ? "hover:bg-background/30" : "opacity-60"
                  }`}
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{lead.name}</h3>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${statusClass(
                            lead.status,
                          )}`}
                        >
                          {statusLabel(lead.status)}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${
                            lead.active
                              ? "border-green-500/30 bg-green-500/10 text-green-400"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {lead.active ? "Activo" : "Inactivo"}
                        </span>

                        {lead.converted_client_id && (
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs ${
                              linkedClient
                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {linkedClient
                              ? "Cliente vinculado"
                              : "Conversión histórica"}
                          </span>
                        )}
                      </div>

                      {lead.company && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {lead.company}
                        </p>
                      )}

                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        {lead.email && (
                          <span className="truncate">✉️ {lead.email}</span>
                        )}
                        {lead.phone && <span>📞 {lead.phone}</span>}
                        {lead.source && <span>🔎 Origen: {lead.source}</span>}
                        <span>
                          📅 Seguimiento:{" "}
                          {lead.next_follow_up
                            ? formatDate(lead.next_follow_up)
                            : "Sin fecha"}
                        </span>
                        <span>Alta: {formatDateTime(lead.created_at)}</span>
                        {lead.updated_at !== lead.created_at && (
                          <span>
                            Actualizado: {formatDateTime(lead.updated_at)}
                          </span>
                        )}
                      </div>

                      {lead.notes && (
                        <div className="mt-3 rounded-lg border border-border bg-background/30 px-3 py-2">
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {lead.notes}
                          </p>
                        </div>
                      )}

                      {hasWinnerHistory && (
                        <div className="mt-4 rounded-lg border border-border bg-background/30 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                            Historial de cierre
                          </p>
                          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                            <span>
                              🏆 Ganado por:{" "}
                              <strong className="font-medium text-foreground">
                                {winnerName}
                              </strong>
                            </span>
                            <span>
                              📅 Fecha de cierre:{" "}
                              <strong className="font-medium text-foreground">
                                {lead.won_at
                                  ? formatDateTime(lead.won_at)
                                  : "No registrada"}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {hasConversionHistory && (
                        <div className="mt-3 rounded-lg border border-border bg-background/30 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                            Historial de conversión
                          </p>
                          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                            <span>
                              👤 Convertido por:{" "}
                              <strong className="font-medium text-foreground">
                                {converterName}
                              </strong>
                            </span>
                            <span>
                              📅 Fecha de conversión:{" "}
                              <strong className="font-medium text-foreground">
                                {lead.converted_at
                                  ? formatDateTime(lead.converted_at)
                                  : "No registrada"}
                              </strong>
                            </span>
                          </div>

                          {lead.converted_client_id && (
                            <div className="mt-3 border-t border-border pt-3">
                              {linkedClient ? (
                                <p className="text-xs text-muted-foreground">
                                  Cliente vinculado:{" "}
                                  <strong className="font-medium text-green-400">
                                    {linkedClient.name}
                                  </strong>
                                </p>
                              ) : (
                                <p className="text-xs text-amber-400">
                                  Cliente eliminado o no disponible. Se
                                  conserva el registro histórico de la
                                  conversión.
                                </p>
                              )}
                              <p className="mt-2 break-all text-xs text-muted-foreground">
                                ID histórico del cliente:{" "}
                                {lead.converted_client_id}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {role === "admin" && (
                      <div className="flex shrink-0 flex-wrap gap-2 xl:max-w-64 xl:justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(lead)}
                          disabled={processingId === lead.id}
                          className={btnGhost}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(lead)}
                          disabled={processingId === lead.id}
                          className={btnGhost}
                        >
                          {processingId === lead.id
                            ? "Procesando..."
                            : lead.active
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                        {lead.status === "ganado" &&
                          !lead.converted_client_id && (
                            <button
                              type="button"
                              onClick={() => handleConvertLead(lead)}
                              disabled={processingId === lead.id}
                              className={btn}
                            >
                              Convertir en cliente
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() => handleDeleteLead(lead)}
                          disabled={processingId === lead.id}
                          className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
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
   MÓDULO ACTIVIDAD Y AUDITORÍA (SOLO ADMIN)
   ========================================================= */

type ActivityRecord = {
  id: number;
  at: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: Record<string, unknown> | null;
};

const ACTIVITY_PAGE_SIZE = 20;

function activityLabel(value: string) {
  const labels: Record<string, string> = {
    INSERT: "Creación", UPDATE: "Modificación", DELETE: "Eliminación",
    clients: "Clientes", leads: "Prospectos", tasks: "Tareas", expenses: "Gastos",
  };
  return labels[value] ?? value;
}

function ActivityModule() {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [profiles, setProfiles] = useState<PanelProfile[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [userId, setUserId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadFilters = async () => {
      const [profilesResult, activityResult] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name").order("email"),
        supabase.from("activity_log").select("action,entity").order("at", { ascending: false }).limit(1000),
      ]);
      if (!active) return;
      if (profilesResult.error || activityResult.error) {
        setError(profilesResult.error?.message ?? activityResult.error?.message ?? "No se pudieron cargar los filtros.");
        return;
      }
      setProfiles((profilesResult.data ?? []) as PanelProfile[]);
      setActions([...new Set((activityResult.data ?? []).map((row) => row.action))].sort());
      setEntities([...new Set((activityResult.data ?? []).map((row) => row.entity))].sort());
    };
    void loadFilters();
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    const loadActivity = async () => {
      setLoading(true);
      setError("");
      try {
        let query = supabase.from("activity_log")
          .select("id,at,user_id,action,entity,entity_id,detail", { count: "exact" })
          .order("at", { ascending: false })
          .order("id", { ascending: false });
        if (action) query = query.eq("action", action);
        if (entity) query = query.eq("entity", entity);
        if (userId === "sin_usuario") query = query.is("user_id", null);
        else if (userId) query = query.eq("user_id", userId);
        if (fromDate) query = query.gte("at", new Date(`${fromDate}T00:00:00`).toISOString());
        if (toDate) {
          const end = new Date(`${toDate}T00:00:00`);
          end.setDate(end.getDate() + 1);
          query = query.lt("at", end.toISOString());
        }
        const { data, count, error: queryError } = await query.range(
          page * ACTIVITY_PAGE_SIZE, (page + 1) * ACTIVITY_PAGE_SIZE - 1,
        );
        if (queryError) throw queryError;
        if (!active) return;
        setRecords((data ?? []) as ActivityRecord[]);
        setTotal(count ?? 0);
      } catch (loadError) {
        if (!active) return;
        console.error("Error cargando actividad:", loadError);
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la actividad.");
        setRecords([]);
        setTotal(0);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadActivity();
    return () => { active = false; };
  }, [action, entity, userId, fromDate, toDate, page, refreshKey]);

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
    setExpandedId(null);
  };
  const profileName = (id: string | null) => {
    if (!id) return "Sin usuario registrado";
    const profile = profiles.find((item) => item.id === id);
    return profile?.full_name || profile?.email || `Usuario ${id.slice(0, 8)}…`;
  };
  const totalPages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));

  return (
    <ModuleHeader eyebrow="// AUDITORÍA" title="Actividad"
      description="Historial de cambios del sistema. Consulta disponible exclusivamente para administradores.">
      {error && <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Filtrar actividad</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnGhost} onClick={() => {
              setAction(""); setEntity(""); setUserId(""); setFromDate(""); setToDate(""); setPage(0); setExpandedId(null);
            }}>Limpiar filtros</button>
            <button type="button" className={btnGhost} disabled={loading} onClick={() => setRefreshKey((value) => value + 1)}>
              Actualizar
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div><label className="mb-1 block text-xs text-muted-foreground">Acción</label>
            <select className={input} value={action} onChange={(e) => updateFilter(setAction, e.target.value)}>
              <option value="">Todas</option>{actions.map((value) => <option key={value} value={value}>{activityLabel(value)}</option>)}
            </select></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Módulo</label>
            <select className={input} value={entity} onChange={(e) => updateFilter(setEntity, e.target.value)}>
              <option value="">Todos</option>{entities.map((value) => <option key={value} value={value}>{activityLabel(value)}</option>)}
            </select></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Usuario</label>
            <select className={input} value={userId} onChange={(e) => updateFilter(setUserId, e.target.value)}>
              <option value="">Todos</option><option value="sin_usuario">Sin usuario</option>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.email || profile.id}</option>)}
            </select></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Desde</label>
            <input type="date" className={input} value={fromDate} max={toDate || undefined}
              onChange={(e) => updateFilter(setFromDate, e.target.value)} /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Hasta</label>
            <input type="date" className={input} value={toDate} min={fromDate || undefined}
              onChange={(e) => updateFilter(setToDate, e.target.value)} /></div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
          <h2 className="font-semibold">Registro de actividad</h2>
          <span className="text-sm text-muted-foreground">{total} {total === 1 ? "evento" : "eventos"}</span>
        </div>
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Cargando actividad...</p> :
          records.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No hay eventos para los filtros seleccionados.</p> :
          <div className="divide-y divide-border">{records.map((record) => (
            <div key={record.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-accent">{activityLabel(record.action)}</span>
                    <span className="font-semibold">{activityLabel(record.entity)}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{profileName(record.user_id)}</p>
                  {record.entity_id && <p className="mt-1 break-all text-xs text-muted-foreground">Registro: {record.entity_id}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("es-AR", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
                    timeZone: "America/Argentina/Buenos_Aires",
                  }).format(new Date(record.at))}</span>
                  <button type="button" className={btnGhost} aria-expanded={expandedId === record.id}
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                    {expandedId === record.id ? "Ocultar detalle" : "Ver detalle"}
                  </button>
                </div>
              </div>
              {expandedId === record.id && <div className="mt-4 rounded-lg border border-border bg-background/60 p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Detalle del evento #{record.id}</p>
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(record.detail ?? {}, null, 2)}</pre>
              </div>}
            </div>
          ))}</div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" className={btnGhost} disabled={loading || page === 0} onClick={() => { setPage((value) => Math.max(0, value - 1)); setExpandedId(null); }}>Anterior</button>
            <button type="button" className={btnGhost} disabled={loading || page + 1 >= totalPages} onClick={() => { setPage((value) => value + 1); setExpandedId(null); }}>Siguiente</button>
          </div>
        </div>
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
        <h2 className="text-lg font-semibold">Módulo en preparación</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta sección será desarrollada después de completar Tareas,
          Clientes y Prospectos.
        </p>
      </div>
    </ModuleHeader>
  );
}

type AgendaKind = "socios" | "comercial";
type AgendaReply = "aceptada" | "rechazada";
type AgendaResponse = AgendaReply | "pendiente";
type AgendaContact = { id: string; display_name: string };
type AgendaMeeting = {
  id: string;
  kind: AgendaKind;
  title: string;
  details: string | null;
  starts_at: string;
  ends_at: string;
  organizer_name: string;
  my_response: AgendaResponse | null;
  attendees: { id: string; name: string; response: AgendaResponse }[] | null;
};

type AgendaDatabase = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      kvant_agenda_list: { Args: { p_from: string; p_to: string }; Returns: AgendaMeeting[] };
      kvant_agenda_contacts: { Args: { p_kind: AgendaKind }; Returns: AgendaContact[] };
      kvant_agenda_create: {
        Args: {
          p_request_id: string;
          p_kind: AgendaKind;
          p_title: string;
          p_details: string;
          p_starts_at: string;
          p_ends_at: string;
          p_invitees: string[];
        };
        Returns: string;
      };
      kvant_agenda_respond: { Args: { p_meeting_id: string; p_response: AgendaReply }; Returns: undefined };
    };
  };
};

const agendaClient = supabase as unknown as SupabaseClient<AgendaDatabase>;
const agendaKinds: Record<AgendaKind, string> = { socios: "Socios", comercial: "Comercial" };
const agendaResponses: Record<AgendaResponse, string> = {
  pendiente: "Pendiente", aceptada: "Aceptada", rechazada: "Rechazada",
};
const agendaMonthFormat = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
const agendaDateFormat = new Intl.DateTimeFormat("es-AR", {
  weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
});

function agendaMonthStart(date = new Date(), offset = 0) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function AgendaCreateForm({ onCreated, onCancel }: {
  onCreated: (start: Date) => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<AgendaKind>("socios");
  const [contacts, setContacts] = useState<AgendaContact[]>([]);
  const [invitees, setInvitees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsFailed, setContactsFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const saveLock = useRef(false);
  const request = useRef<{ key: string; id: string } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setContactsFailed(false);
    void (async () => {
      try {
        const { data, error: queryError } = await agendaClient.rpc("kvant_agenda_contacts", { p_kind: kind });
        if (queryError) throw queryError;
        if (active) setContacts(data ?? []);
      } catch (queryError) {
        console.error("Error cargando contactos de agenda:", queryError);
        if (active) setContactsFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [kind, reload]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saveLock.current || loading || contactsFailed) return;
    const fields = new FormData(event.currentTarget);
    const title = String(fields.get("title") ?? "").trim();
    const startsAt = new Date(String(fields.get("start") ?? ""));
    const endsAt = new Date(String(fields.get("end") ?? ""));
    if (!title || !(endsAt > startsAt) || invitees.length === 0) {
      setError("Ingresá un título, elegí un final posterior al inicio y seleccioná al menos un invitado.");
      return;
    }

    saveLock.current = true;
    setSaving(true);
    setError("");
    try {
      const payload = {
        p_kind: kind,
        p_title: title,
        p_details: String(fields.get("details") ?? "").trim(),
        p_starts_at: startsAt.toISOString(),
        p_ends_at: endsAt.toISOString(),
        p_invitees: [...invitees].sort(),
      };
      const key = JSON.stringify(payload);
      if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
      const { error: createError } = await agendaClient.rpc("kvant_agenda_create", {
        ...payload,
        p_request_id: request.current.id,
      });
      if (createError) throw createError;
      onCreated(startsAt);
    } catch (createError) {
      console.error("Error creando reunión:", createError);
      setError("No se confirmó el guardado. Si se interrumpió la conexión, revisá el mes de la reunión antes de volver a crearla.");
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  return (
    <form className="mb-6 rounded-xl border border-border bg-card p-5" onSubmit={create}>
      <h2 className="mb-4 text-lg font-semibold">Nueva reunión</h2>
      <fieldset disabled={saving} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Título
            <input name="title" required maxLength={160} className={input + " mt-1"} />
          </label>
          <label className="block text-sm">Tipo
            <select className={input + " mt-1"} value={kind} onChange={(event) => {
              setLoading(true);
              setInvitees([]);
              setKind(event.target.value === "socios" ? "socios" : "comercial");
            }}>
              <option value="socios">Socios</option>
              <option value="comercial">Comercial</option>
            </select>
          </label>
          <label className="block text-sm">Inicio
            <input type="datetime-local" name="start" required className={input + " mt-1"} />
          </label>
          <label className="block text-sm">Fin
            <input type="datetime-local" name="end" required className={input + " mt-1"} />
          </label>
        </div>
        <label className="block text-sm">Lugar, enlace o detalles
          <textarea name="details" maxLength={4000} className={input + " mt-1 min-h-20"} />
        </label>
        <fieldset className="rounded-lg border border-border p-3">
          <legend className="px-1 text-sm font-medium">Invitados ({invitees.length}/50)</legend>
          {loading ? (
            <p role="status" className="text-sm text-muted-foreground">Cargando personas…</p>
          ) : contactsFailed ? (
            <div className="flex flex-wrap items-center gap-2">
              <p role="alert" className="text-sm text-red-400">No se pudieron cargar los invitados disponibles.</p>
              <button type="button" className={btnGhost} onClick={() => setReload((value) => value + 1)}>Reintentar</button>
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay otros usuarios habilitados para este tipo de reunión.</p>
          ) : (
            <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
              {contacts.map((contact) => (
                <label key={contact.id} className="flex min-w-0 items-start gap-2 text-sm [overflow-wrap:anywhere]">
                  <input type="checkbox" className="mt-1 shrink-0" checked={invitees.includes(contact.id)}
                    disabled={invitees.length >= 50 && !invitees.includes(contact.id)}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      setInvitees((current) => checked ? [...current, contact.id] : current.filter((id) => id !== contact.id));
                    }} />
                  {contact.display_name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={btn} type="submit" disabled={saving || loading || contactsFailed || invitees.length === 0}>
          {saving ? "Guardando…" : "Guardar y enviar invitaciones internas"}
        </button>
        <button className={btnGhost} type="button" disabled={saving} onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

function AgendaModule({ role }: { role: PanelRole }) {
  const [month, setMonth] = useState(() => agendaMonthStart());
  const [meetings, setMeetings] = useState<AgendaMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [creating, setCreating] = useState(false);
  const [responding, setResponding] = useState(false);
  const [notice, setNotice] = useState("");
  const [replyError, setReplyError] = useState("");
  const replyLock = useRef(false);
  const nextMonth = agendaMonthStart(month, 1);
  const meetingsThisMonth = meetings.filter((meeting) => {
    const startsAt = new Date(meeting.starts_at);
    return startsAt >= month && startsAt < nextMonth;
  });
  const pendingElsewhere = meetings.filter((meeting) => !meetingsThisMonth.includes(meeting));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    void (async () => {
      try {
        const { data, error } = await agendaClient.rpc("kvant_agenda_list", {
          p_from: month.toISOString(),
          p_to: agendaMonthStart(month, 1).toISOString(),
        });
        if (error) throw error;
        if (active) setMeetings(data ?? []);
      } catch (error) {
        console.error("Error cargando agenda:", error);
        if (active) setLoadFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [month, reload]);

  const changeMonth = (value: Date) => {
    setLoading(true);
    setMonth(value);
  };

  const respond = async (meeting: AgendaMeeting, response: AgendaReply) => {
    if (!meeting.my_response || meeting.my_response === response || replyLock.current) return;
    replyLock.current = true;
    setResponding(true);
    setReplyError("");
    setNotice("");
    try {
      const { error } = await agendaClient.rpc("kvant_agenda_respond", {
        p_meeting_id: meeting.id, p_response: response,
      });
      if (error) throw error;
      setMeetings((current) => current.map((item) => item.id === meeting.id ? { ...item, my_response: response } : item));
      setNotice("Respuesta guardada.");
    } catch (error) {
      console.error("Error respondiendo invitación:", error);
      setReplyError("No pudimos confirmar tu respuesta. Actualizá la agenda o volvé a intentar.");
    } finally {
      replyLock.current = false;
      setResponding(false);
    }
  };

  return (
    <ModuleHeader eyebrow="// AGENDA" title="Agenda compartida"
      description="Reuniones internas e invitaciones. Los horarios se muestran en la zona horaria de tu dispositivo."
      actionLabel={role === "admin" ? "Nueva reunión" : undefined}
      onAction={role === "admin" ? () => setCreating(true) : undefined}>
      {creating && role === "admin" && (
        <AgendaCreateForm onCancel={() => setCreating(false)} onCreated={(start) => {
          setCreating(false);
          changeMonth(agendaMonthStart(start));
          setNotice("Reunión guardada. Las invitaciones están disponibles en la agenda de cada invitado.");
        }} />
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold capitalize">{agendaMonthFormat.format(month)}</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnGhost} aria-label="Mes anterior" onClick={() => changeMonth(agendaMonthStart(month, -1))}>Anterior</button>
          <button type="button" className={btnGhost} onClick={() => changeMonth(agendaMonthStart())}>Hoy</button>
          <button type="button" className={btnGhost} aria-label="Mes siguiente" onClick={() => changeMonth(agendaMonthStart(month, 1))}>Siguiente</button>
          <button type="button" className={btnGhost} disabled={loading || responding} onClick={() => setReload((value) => value + 1)}>Actualizar</button>
        </div>
      </div>
      <p role="status" className="text-sm text-muted-foreground">{notice}</p>
      {replyError && <p role="alert" className="text-sm text-red-400">{replyError}</p>}
      {!loading && !loadFailed && pendingElsewhere.length > 0 && (
        <section aria-label="Invitaciones pendientes en otros meses" className="mb-4 rounded-xl border border-accent/30 bg-card p-4">
          <h3 className="mb-2 font-semibold">Invitaciones pendientes en otros meses</h3>
          <ul className="space-y-1">
            {pendingElsewhere.map((meeting) => (
              <li key={meeting.id}>
                <button type="button" className="text-left text-sm text-accent [overflow-wrap:anywhere] hover:underline"
                  onClick={() => changeMonth(agendaMonthStart(new Date(meeting.starts_at)))}>
                  {meeting.title} · {agendaDateFormat.format(new Date(meeting.starts_at))}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {loading ? (
        <p role="status" className="py-6 text-sm text-muted-foreground">Cargando reuniones…</p>
      ) : loadFailed ? (
        <p role="alert" className="py-6 text-sm text-red-400">No se pudo cargar la agenda. Revisá que la configuración de Supabase esté aplicada y volvé a actualizar.</p>
      ) : meetingsThisMonth.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">No tenés reuniones en este mes.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {meetingsThisMonth.map((meeting) => (
            <li key={meeting.id} className="space-y-3 rounded-xl border border-border bg-card p-5 [overflow-wrap:anywhere]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-lg font-semibold">{meeting.title}</h3>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-accent">{agendaKinds[meeting.kind]}</span>
              </div>
              <p className="text-sm">
                <time dateTime={meeting.starts_at}>{agendaDateFormat.format(new Date(meeting.starts_at))}</time>
                {" – "}
                <time dateTime={meeting.ends_at}>{agendaDateFormat.format(new Date(meeting.ends_at))}</time>
              </p>
              <p className="text-sm text-muted-foreground">Organiza {meeting.organizer_name}</p>
              {meeting.details && <p className="whitespace-pre-wrap text-sm">{meeting.details}</p>}
              {meeting.my_response && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-2 text-sm">Tu respuesta · {agendaResponses[meeting.my_response]}</span>
                  <button type="button" className={btnGhost} disabled={responding || meeting.my_response === "aceptada"}
                    onClick={() => void respond(meeting, "aceptada")}>Aceptar</button>
                  <button type="button" className={btnGhost} disabled={responding || meeting.my_response === "rechazada"}
                    onClick={() => void respond(meeting, "rechazada")}>Rechazar</button>
                </div>
              )}
              {meeting.attendees && (
                <div className="border-t border-border pt-3">
                  <h4 className="mb-2 text-sm font-semibold">Respuestas de los invitados</h4>
                  <ul className="space-y-1 text-sm">
                    {meeting.attendees.map((person) => (
                      <li key={person.id} className="flex flex-wrap justify-between gap-2">
                        <span>{person.name}</span>
                        <span className="text-muted-foreground">{agendaResponses[person.response]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
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
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        {actionLabel && (
          <button type="button" onClick={onAction} className={btn}>
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

function Dashboard({ role, userId }: { role: PanelRole; userId: string }) {
  const [tasksRevision, setTasksRevision] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      if (!tasksRevision) setLoading(true);
      setError("");

      try {
        const today = getLocalDateString();
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        const monthStart = getLocalDateString(firstDayOfMonth);

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
            .select("id", { count: "exact", head: true })
            .is("completed_at", null),

          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .is("completed_at", null)
            .lt("due_date", today),

          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("active", true),

          supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("active", true),

          supabase
            .from("tasks")
            .select("id,title,status,priority,due_date")
            .is("completed_at", null)
            .not("due_date", "is", null)
            .gte("due_date", today)
            .order("due_date", { ascending: true })
            .limit(5),

          supabase
            .from("expenses")
            .select("amount,currency,spent_on")
            .gte("spent_on", monthStart)
            .lte("spent_on", today)
            .eq("active", true),

          role === "admin"
            ? supabase
                .from("activity_log")
                .select("id,at,action,entity,entity_id,detail")
                .order("at", { ascending: false })
                .limit(5)
            : Promise.resolve({ data: [], error: null }),
        ]);

        const firstError =
          pendingTasksResult.error ??
          overdueTasksResult.error ??
          activeClientsResult.error ??
          activeLeadsResult.error ??
          upcomingTasksResult.error ??
          expensesResult.error ??
          activityResult.error;

        if (firstError) throw firstError;

        const expenseMap = new Map<string, number>();
        for (const expense of expensesResult.data ?? []) {
          const currency = expense.currency || "SIN MONEDA";
          const amount = Number(expense.amount) || 0;
          expenseMap.set(
            currency,
            (expenseMap.get(currency) ?? 0) + amount,
          );
        }

        const expenses = Array.from(expenseMap.entries())
          .map(([currency, total]) => ({ currency, total }))
          .sort((a, b) => b.total - a.total);

        if (!mounted) return;

        setData({
          pendingTasks: pendingTasksResult.count ?? 0,
          overdueTasks: overdueTasksResult.count ?? 0,
          activeClients: activeClientsResult.count ?? 0,
          activeLeads: activeLeadsResult.count ?? 0,
          expenses,
          upcomingTasks: (upcomingTasksResult.data ?? []) as DashboardTask[],
          recentActivity: (activityResult.data ?? []) as DashboardActivity[],
        });
      } catch (dashboardError) {
        console.error("Error cargando dashboard:", dashboardError);
        if (mounted) {
          setError("No pudimos cargar los datos del dashboard.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [role, tasksRevision]);

  if (loading) {
    return (
      <>
        <div className="mb-8">
          <p className="text-sm font-medium tracking-wide text-accent">
            // DASHBOARD
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Panel interno</h1>
          <p className="mt-2 text-muted-foreground">
            Cargando información...
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
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
          <h1 className="mt-2 text-3xl font-semibold">Panel interno</h1>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400">
          {error || "No hay datos disponibles."}
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
        <h1 className="mt-2 text-3xl font-semibold">Panel interno</h1>
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

      <section className="mt-8" aria-label="Tareas del dashboard">
        <TasksModule role={role} userId={userId} initialView="calendario"
          onTasksChanged={() => setTasksRevision((value) => value + 1)} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Próximas tareas">
          {data.upcomingTasks.length === 0 ? (
            <EmptyState message="No hay tareas próximas." />
          ) : (
            <div className="divide-y divide-border">
              {data.upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{task.title}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {task.priority && (
                        <span>Prioridad: {task.priority}</span>
                      )}
                      {task.status && <span>Estado: {task.status}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm text-accent">
                    {formatDate(task.due_date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Gastos del mes">
          {data.expenses.length === 0 ? (
            <EmptyState message="No hay gastos registrados este mes." />
          ) : (
            <div className="space-y-3">
              {data.expenses.map((expense) => (
                <div
                  key={expense.currency}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3"
                >
                  <span className="text-sm text-muted-foreground">
                    {expense.currency}
                  </span>
                  <span className="font-semibold">
                    {formatAmount(expense.total, expense.currency)}
                  </span>
                </div>
              ))}
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
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.entity}
                          {activity.entity_id
                            ? ` · ${activity.entity_id}`
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(activity.at)}
                      </span>
                    </div>
                  </div>
                ))}
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
      <p className="text-sm text-muted-foreground">{title}</p>
      <p
        className={`mt-3 text-3xl font-semibold ${
          alert ? "text-red-400" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
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
      <h2 className="mb-2 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const [year, month, day] = getLocalDateString(date).split("-");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function formatAmount(amount: number, _currency: string) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function AccessDenied() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
        <div className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mb-5 text-4xl">🔒</div>
          <h1 className="text-2xl font-semibold">Acceso no autorizado</h1>
          <p className="mt-3 text-muted-foreground">
            Tu cuenta está autenticada, pero no tiene permisos para acceder
            al panel interno.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/" className={btnGhost}>
              Volver al sitio
            </Link>
            <button type="button" onClick={handleSignOut} className={btn}>
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
          src={logoIcon}
          alt="kvantcode"
          className="mx-auto mb-4 h-12 w-auto opacity-80"
        />
        <p className="text-sm text-muted-foreground">Cargando panel...</p>
      </div>
    </main>
  );
}