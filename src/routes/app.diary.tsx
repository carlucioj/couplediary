import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookHeart, Plus, Trash2, Send, CalendarPlus } from "lucide-react";
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
import { logActivity, notifyPartnerWhatsApp } from "@/lib/notify";

export const Route = createFileRoute("/app/diary")({
  head: () => ({ meta: [{ title: "Diário do dia — Nosso Diário" }] }),
  component: () => (
    <AppShell>
      <DiaryPage />
    </AppShell>
  ),
});

const MOODS = ["💖", "😊", "😍", "🥰", "😌", "🌧️", "🎉", "🍷"];

type Memory = {
  id: string;
  memory_date: string;
  title: string;
  note: string | null;
  mood: string | null;
  created_at: string;
};

function DiaryPage() {
  const { user } = useAuth();
  const { couple, partner } = useCouple();
  const [items, setItems] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<string>("💖");
  const [submitting, setSubmitting] = useState(false);
  const [addToCalendar, setAddToCalendar] = useState(true);

  async function load() {
    if (!couple) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("day_memories")
      .select("id, memory_date, title, note, mood, created_at")
      .eq("couple_id", couple.id)
      .order("memory_date", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setItems((data as Memory[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!couple || !user) return;
    if (!title.trim()) return toast.error("Dê um título à memória");
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("day_memories")
        .insert({
          couple_id: couple.id,
          created_by: user.id,
          memory_date: date,
          title: title.trim(),
          note: note.trim() || null,
          mood,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (addToCalendar) {
        await supabase.from("events").insert({
          couple_id: couple.id,
          created_by: user.id,
          title: `${mood} ${title.trim()}`,
          description: note.trim() || null,
          starts_at: new Date(`${date}T20:00:00`).toISOString(),
          event_type: "memory",
        });
      }

      await logActivity({
        couple_id: couple.id,
        actor_id: user.id,
        activity_type: "memory_added",
        payload: { id: data.id, title: title.trim(), date },
      });

      toast.success("Memória registrada 💞");
      setOpen(false);
      setTitle("");
      setNote("");
      setMood("💖");
      setAddToCalendar(true);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("day_memories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((s) => s.filter((m) => m.id !== id));
  }

  function shareWhatsApp(m: Memory) {
    notifyPartnerWhatsApp({
      partnerPhone: partner?.phone,
      message: `💞 Nosso Diário — ${m.memory_date}\n${m.mood ?? ""} ${m.title}${m.note ? `\n\n${m.note}` : ""}`,
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blush text-primary">
            <BookHeart className="h-5 w-5" />
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Diário do dia</h1>
          <p className="text-sm text-muted-foreground">O que vocês viveram hoje fica eternizado aqui.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Nova memória</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar momento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="d-date">Data</Label>
                  <Input id="d-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Humor</Label>
                  <div className="flex flex-wrap gap-1">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMood(m)}
                        className={`h-9 w-9 rounded-md text-lg transition ${
                          mood === m ? "bg-blush ring-2 ring-primary" : "bg-muted hover:bg-accent/50"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-title">Título</Label>
                <Input id="d-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Jantar especial..." required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-note">Detalhes</Label>
                <Textarea id="d-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Como foi, o que sentimos..." />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={addToCalendar} onChange={(e) => setAddToCalendar(e.target.checked)} />
                <CalendarPlus className="h-4 w-4" /> Adicionar também ao calendário
              </label>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar memória"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Ainda nenhuma memória. Que tal começar pelo dia de hoje? 💞</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.id} className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] animate-float-up">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {new Date(m.memory_date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                  </div>
                  <h3 className="mt-0.5 text-base font-semibold">
                    <span className="mr-1.5">{m.mood}</span>{m.title}
                  </h3>
                  {m.note && <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{m.note}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => shareWhatsApp(m)} aria-label="Enviar no WhatsApp">
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} aria-label="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
