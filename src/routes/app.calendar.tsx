import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar as CalIcon, Plus, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/use-couple";
import { logActivity } from "@/lib/notify";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({ meta: [{ title: "Calendário — Nosso Diário" }] }),
  component: () => (
    <AppShell>
      <CalendarPage />
    </AppShell>
  ),
});

type Event = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  event_type: string;
};

function pad(n: number) { return String(n).padStart(2, "0"); }
function ymd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function googleCalendarLink(e: Event): string {
  const start = new Date(e.starts_at);
  const end = e.ends_at ? new Date(e.ends_at) : new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: e.description ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function CalendarPage() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<string>(ymd(new Date()));
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startsAt, setStartsAt] = useState(`${ymd(new Date())}T20:00`);
  const [endsAt, setEndsAt] = useState("");
  const [type, setType] = useState("date");

  async function load() {
    if (!couple) return;
    setLoading(true);
    const start = new Date(cursor); start.setDate(1); start.setHours(0, 0, 0, 0);
    const end = new Date(cursor); end.setMonth(end.getMonth() + 1); end.setDate(0); end.setHours(23, 59, 59);
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, starts_at, ends_at, event_type")
      .eq("couple_id", couple.id)
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at");
    if (error) toast.error(error.message);
    setEvents((data as Event[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id, cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const k = ymd(new Date(e.starts_at));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return map;
  }, [events]);

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const startWeekday = first.getDay();
    const days: { date: Date | null }[] = [];
    for (let i = 0; i < startWeekday; i++) days.push({ date: null });
    for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });
    return days;
  }, [cursor]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!couple || !user || !title.trim()) return;
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
        couple_id: couple.id, actor_id: user.id,
        activity_type: "event_added", payload: { title: title.trim(), starts_at: startsAt },
      });
      toast.success("Evento criado 💞");
      setOpen(false); setTitle(""); setDesc(""); setEndsAt("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setEvents((s) => s.filter((e) => e.id !== id));
  }

  const monthLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const selectedEvents = eventsByDay.get(selected) ?? [];

  function openCreateForDay(day: string) {
    setSelected(day);
    setStartsAt(`${day}T20:00`);
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blush text-primary">
            <CalIcon className="h-5 w-5" />
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Calendário</h1>
          <p className="text-sm text-muted-foreground">Datas, encontros e memórias do mês.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Evento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo evento</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="e-title">Título</Label>
                <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e-start">Início</Label>
                  <Input id="e-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-end">Fim</Label>
                  <Input id="e-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-type">Tipo</Label>
                <select
                  id="e-type" value={type} onChange={(e) => setType(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="date">Encontro</option>
                  <option value="anniversary">Aniversário</option>
                  <option value="trip">Viagem</option>
                  <option value="memory">Memória</option>
                  <option value="reminder">Lembrete</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-desc">Descrição</Label>
                <Textarea id="e-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => { const n = new Date(cursor); n.setMonth(n.getMonth() - 1); setCursor(n); }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold capitalize">{monthLabel}</h2>
          <Button variant="ghost" size="icon" onClick={() => { const n = new Date(cursor); n.setMonth(n.getMonth() + 1); setCursor(n); }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthDays.map((d, i) => {
            if (!d.date) return <div key={i} />;
            const k = ymd(d.date);
            const has = (eventsByDay.get(k)?.length ?? 0) > 0;
            const isToday = k === ymd(new Date());
            const isSelected = k === selected;
            return (
              <button
                key={i}
                onClick={() => setSelected(k)}
                onDoubleClick={() => openCreateForDay(k)}
                className={cn(
                  "relative aspect-square rounded-lg text-sm transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" :
                    isToday ? "bg-blush text-primary font-semibold" :
                    "hover:bg-accent/40",
                )}
              >
                {d.date.getDate()}
                {has && (
                  <span className={cn(
                    "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary",
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">
          {new Date(selected).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : selectedEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Nada agendado nesse dia.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => openCreateForDay(selected)}>
              <Plus className="mr-1 h-4 w-4" /> Criar evento
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-card p-3 shadow-[var(--shadow-card)]">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {new Date(e.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <h4 className="truncate font-medium">{e.title}</h4>
                  {e.description && <p className="line-clamp-2 text-sm text-muted-foreground">{e.description}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <a href={googleCalendarLink(e)} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" aria-label="Abrir no Google Calendar"><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} aria-label="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
