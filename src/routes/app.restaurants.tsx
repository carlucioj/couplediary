import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Utensils, Plus, Trash2, MapPin, Star, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/use-couple";
import { logActivity } from "@/lib/notify";

export const Route = createFileRoute("/app/restaurants")({
  head: () => ({ meta: [{ title: "Restaurantes — Nosso Diário" }] }),
  component: () => (
    <AppShell>
      <RestaurantsPage />
    </AppShell>
  ),
});

type Restaurant = {
  id: string;
  status: string;
  name: string;
  location: string | null;
  rating: number | null;
  notes: string | null;
  favorite_dish: string | null;
  visited_at: string | null;
};

function RestaurantsPage() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [items, setItems] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"visited" | "wishlist">("visited");
  const [rating, setRating] = useState<number>(5);
  const [favoriteDish, setFavoriteDish] = useState("");
  const [notes, setNotes] = useState("");
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().slice(0, 10));

  async function load() {
    if (!couple) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, status, name, location, rating, notes, favorite_dish, visited_at")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Restaurant[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id]);

  function reset() {
    setName(""); setLocation(""); setStatus("visited"); setRating(5);
    setFavoriteDish(""); setNotes(""); setVisitedAt(new Date().toISOString().slice(0, 10));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!couple || !user) return;
    if (!name.trim()) return toast.error("Nome do restaurante é obrigatório");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("restaurants").insert({
        couple_id: couple.id,
        created_by: user.id,
        name: name.trim(),
        location: location.trim() || null,
        status,
        rating: status === "visited" ? rating : null,
        favorite_dish: status === "visited" ? (favoriteDish.trim() || null) : null,
        notes: notes.trim() || null,
        visited_at: status === "visited" ? visitedAt : null,
      });
      if (error) throw error;
      await logActivity({
        couple_id: couple.id, actor_id: user.id,
        activity_type: status === "visited" ? "restaurant_visited" : "restaurant_wished",
        payload: { name: name.trim() },
      });
      toast.success(status === "visited" ? "Restaurante adicionado 🍷" : "Adicionado aos desejos");
      setOpen(false); reset(); load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function markVisited(id: string) {
    const { error } = await supabase
      .from("restaurants")
      .update({ status: "visited", visited_at: new Date().toISOString().slice(0, 10) })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marcado como visitado!");
    load();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("restaurants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((s) => s.filter((r) => r.id !== id));
  }

  const visited = items.filter((i) => i.status === "visited");
  const wishlist = items.filter((i) => i.status !== "visited");

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blush text-primary">
            <Utensils className="h-5 w-5" />
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Restaurantes</h1>
          <p className="text-sm text-muted-foreground">Onde já fomos e onde queremos ir.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo restaurante</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex gap-2">
                <Button type="button" variant={status === "visited" ? "default" : "outline"} onClick={() => setStatus("visited")} className="flex-1">Já fomos</Button>
                <Button type="button" variant={status === "wishlist" ? "default" : "outline"} onClick={() => setStatus("wishlist")} className="flex-1">Queremos ir</Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-name">Nome</Label>
                <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-loc">Endereço / cidade</Label>
                <Input id="r-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Vila Madalena, SP" />
              </div>
              {status === "visited" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="r-date">Visitamos em</Label>
                      <Input id="r-date" type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nota</Label>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} estrelas`}>
                            <Star className={`h-6 w-6 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="r-dish">Prato favorito</Label>
                    <Input id="r-dish" value={favoriteDish} onChange={(e) => setFavoriteDish(e.target.value)} placeholder="Risoto de funghi..." />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="r-notes">Notas</Label>
                <Textarea id="r-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="visited">
        <TabsList>
          <TabsTrigger value="visited">Já fomos ({visited.length})</TabsTrigger>
          <TabsTrigger value="wishlist">Queremos ir ({wishlist.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="visited" className="mt-4">
          <List items={visited} onDelete={handleDelete} emptyMsg="Nenhum restaurante registrado ainda." />
        </TabsContent>
        <TabsContent value="wishlist" className="mt-4">
          <List items={wishlist} onDelete={handleDelete} onMarkVisited={markVisited} emptyMsg="Nenhum lugar na lista de desejos." />
        </TabsContent>
      </Tabs>

      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
    </div>
  );
}

function List({
  items, onDelete, onMarkVisited, emptyMsg,
}: {
  items: Restaurant[];
  onDelete: (id: string) => void;
  onMarkVisited?: (id: string) => void;
  emptyMsg: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
        {emptyMsg}
      </div>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((r) => (
        <li key={r.id} className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] animate-float-up">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold">{r.name}</h3>
              {r.location && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {r.location}
                </p>
              )}
              {r.rating != null && (
                <div className="mt-1 flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-3.5 w-3.5 ${n <= (r.rating ?? 0) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                  ))}
                </div>
              )}
              {r.favorite_dish && <p className="mt-1 text-xs text-muted-foreground">🍽️ {r.favorite_dish}</p>}
              {r.notes && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{r.notes}</p>}
            </div>
            <div className="flex flex-col gap-1">
              {onMarkVisited && (
                <Button variant="ghost" size="icon" onClick={() => onMarkVisited(r.id)} aria-label="Marcar como visitado">
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => onDelete(r.id)} aria-label="Excluir">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
