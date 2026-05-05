import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  CalendarDays,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/use-couple";
import { logActivity } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { DEMO_EVENTS } from "@/lib/demo-data";
import {
  type CalendarEvent,
  getEventConfig,
  downloadICS,
  googleCalendarURL,
  toYMD,
} from "@/lib/event-utils";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({ meta: [{ title: "Calendário — Nosso Diário" }] }),
  component: () => (
    <AppShell>
      <CalendarPage />
    </AppShell>
  ),
});

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const EVENT_TYPE_OPTIONS = [
  { value: "date", label: "🍷 Encontro" },
  { value: "anniversary", label: "💖 Aniversário" },
  { value: "trip", label: "✈️ Viagem" },
  { value: "memory", label: "📸 Memória" },
  { value: "reminder", label: "🔔 Lembrete" },
];

function CalendarPage() {
  const { user, isDemo } = useAuth();
  const { couple } = useCouple();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<string>(toYMD(new Date()));
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startsAt, setStartsAt] = useState(`${toYMD(new Date())}T20:00`);
  const [endsAt, setEndsAt] = useState("");
  const [type, setType] = useState("date");

  async function load() {
    if (isDemo) {
      setEvents(DEMO_EVENTS as CalendarEvent[]);
      setLoading(false);
      return;
    }
    if (!couple) return;
    setLoading(true);
    const start = new Date(cursor);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(cursor);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59);
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, starts_at, ends_at, event_type")
      .eq("couple_id", couple.id)
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at");
    if (error) toast.error(error.message);
    setEvents((data as CalendarEvent[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id, cursor, isDemo]);

  // Agrupa eventos por dia
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = toYMD(new Date(e.starts_at));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return map;
  }, [events]);

  // Gera células do mês (null = célula vazia antes do dia 1)
  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++)
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return cells;
  }, [cursor]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (isDemo) {
      const newEvt: CalendarEvent = {
        id: `evt-${Date.now()}`,
        title: title.trim(),
        description: desc.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        event_type: type,
      };
      setEvents((s) => [...s, newEvt]);
      toast.success("Evento criado 💞");
      setOpen(false);
      setTitle("");
      setDesc("");
      setEndsAt("");
      return;
    }
    if (!couple || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("events").insert({
        couple_id: couple.id,
        created_by: user.id,
        title: title.trim(),
        description: desc.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        event_type: type,
      });
      if (error) throw error;
      await logActivity({
        couple_id: couple.id,
        actor_id: user.id,
        activity_type: "event_added",
        payload: { title: title.trim(), starts_at: startsAt },
      });
      toast.success("Evento criado 💞");
      setOpen(false);
      setTitle("");
      setDesc("");
      setEndsAt("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (isDemo) {
      setEvents((s) => s.filter((e) => e.id !== id));
      return;
    }
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setEvents((s) => s.filter((e) => e.id !== id));
  }

  function openCreateForDay(day: string) {
    setSelected(day);
    setStartsAt(`${day}T20:00`);
    setOpen(true);
  }

  const monthLabel = cursor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const todayKey = toYMD(new Date());
  const selectedEvents = eventsByDay.get(selected) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blush text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Calendário</h1>
          <p className="text-sm text-muted-foreground">
            Datas, encontros e memórias do casal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Assinar calendário (webcal) */}
          {couple && !isDemo ? (
            <a
              href={`webcal://${window.location.host}/api/calendar/ics/${couple.id}`}
              title="Assinar calendário na agenda nativa"
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Assinar</span>
              </Button>
            </a>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Disponível apenas na versão completa"
              className="gap-1.5 opacity-50"
            >
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Assinar</span>
            </Button>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo evento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="e-title">Título</Label>
                  <Input
                    id="e-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-type">Tipo</Label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {EVENT_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        className={cn(
                          "rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors",
                          type === opt.value
                            ? "border-primary bg-blush text-primary"
                            : "border-border bg-muted text-muted-foreground hover:bg-accent/40"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="e-start">Início</Label>
                    <Input
                      id="e-start"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="e-end">Fim (opcional)</Label>
                    <Input
                      id="e-end"
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-desc">Descrição</Label>
                  <Textarea
                    id="e-desc"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Legenda de tipos */}
      <div className="flex flex-wrap gap-2">
        {EVENT_TYPE_OPTIONS.map((opt) => {
          const cfg = getEventConfig(opt.value);
          return (
            <span
              key={opt.value}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                cfg.bg,
                cfg.border,
                cfg.color
              )}
            >
              {opt.label}
            </span>
          );
        })}
      </div>

      {/* Grade do calendário */}
      <section className="rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        {/* Navegação de mês */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mês anterior"
            onClick={() => {
              const n = new Date(cursor);
              n.setMonth(n.getMonth() - 1);
              setCursor(n);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold capitalize">{monthLabel}</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Próximo mês"
            onClick={() => {
              const n = new Date(cursor);
              n.setMonth(n.getMonth() + 1);
              setCursor(n);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Células dos dias */}
        <div className="grid grid-cols-7">
          {monthDays.map((day, i) => {
            if (!day) {
              return <div key={`empty-${i}`} className="min-h-[72px] border-b border-r last:border-r-0" />;
            }
            const key = toYMD(day);
            const dayEvents = eventsByDay.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selected;
            const colIndex = i % 7;

            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                onDoubleClick={() => openCreateForDay(key)}
                aria-label={`${day.getDate()} de ${cursor.toLocaleDateString("pt-BR", { month: "long" })}, ${dayEvents.length} evento(s)`}
                className={cn(
                  "group relative flex min-h-[72px] flex-col gap-1 border-b p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  // borda direita exceto última coluna
                  colIndex < 6 && "border-r",
                  isSelected
                    ? "bg-blush/60"
                    : isToday
                    ? "bg-blush/20"
                    : "hover:bg-accent/30"
                )}
              >
                {/* Número do dia */}
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                      ? "font-bold text-primary"
                      : "text-foreground"
                  )}
                >
                  {day.getDate()}
                </span>

                {/* Badges de eventos */}
                <div className="flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 3).map((evt) => {
                    const cfg = getEventConfig(evt.event_type);
                    return (
                      <span
                        key={evt.id}
                        title={evt.title}
                        className={cn(
                          "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] leading-none",
                          cfg.bg,
                          cfg.border,
                          "border"
                        )}
                      >
                        {cfg.emoji}
                      </span>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-muted px-1 text-[9px] font-bold text-muted-foreground">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Painel de eventos do dia selecionado */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {new Date(selected + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => openCreateForDay(selected)}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-20 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : selectedEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
            <CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nada agendado nesse dia.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => openCreateForDay(selected)}
            >
              <Plus className="mr-1 h-4 w-4" /> Criar evento
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((evt) => {
              const cfg = getEventConfig(evt.event_type);
              return (
                <li
                  key={evt.id}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 shadow-[var(--shadow-card)] animate-float-up",
                    cfg.bg,
                    cfg.border
                  )}
                >
                  {/* Ícone do tipo */}
                  <span className="mt-0.5 text-2xl leading-none">
                    {cfg.emoji}
                  </span>

                  {/* Conteúdo */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          cfg.bg,
                          cfg.color
                        )}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(evt.starts_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {evt.ends_at &&
                          ` – ${new Date(evt.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                    </div>
                    <h4 className={cn("mt-1 font-semibold", cfg.color)}>
                      {evt.title}
                    </h4>
                    {evt.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-1">
                    <a
                      href={googleCalendarURL(evt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir no Google Calendar"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Baixar .ics"
                      onClick={() => downloadICS(evt)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Excluir evento"
                      onClick={() => handleDelete(evt.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
