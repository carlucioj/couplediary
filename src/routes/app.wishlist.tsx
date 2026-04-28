import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, Plus, Trash2, ExternalLink, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/use-couple";
import { logActivity } from "@/lib/notify";

export const Route = createFileRoute("/app/wishlist")({
  head: () => ({ meta: [{ title: "Lista de desejos — Nosso Diário" }] }),
  component: () => (
    <AppShell>
      <WishlistPage />
    </AppShell>
  ),
});

type Wish = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  brand: string | null;
  price: number | null;
  currency: string | null;
  status: string;
  for_whom: string;
};

function WishlistPage() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [items, setItems] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [forWhom, setForWhom] = useState<"us" | "her" | "him">("us");
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);

  async function load() {
    if (!couple) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("wishlist_items")
      .select("id, title, description, url, image_url, brand, price, currency, status, for_whom")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Wish[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id]);

  async function fetchMeta(): Promise<Partial<Wish> | null> {
    if (!url.trim()) return null;
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-link-meta", {
        body: { url: url.trim() },
      });
      if (error) throw error;
      return data as Partial<Wish>;
    } catch (err) {
      toast.error("Não foi possível ler o link, mas você pode adicionar manualmente.");
      return null;
    } finally {
      setFetching(false);
    }
  }

  async function handleAuto() {
    const meta = await fetchMeta();
    if (meta?.title) setTitle(meta.title);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!couple || !user) return;
    setSubmitting(true);
    try {
      let meta: Partial<Wish> | null = null;
      if (url.trim() && !title.trim()) meta = await fetchMeta();

      const finalTitle = title.trim() || meta?.title || url.trim() || "Sem título";

      const { error } = await supabase.from("wishlist_items").insert({
        couple_id: couple.id,
        created_by: user.id,
        title: finalTitle,
        description: meta?.description ?? null,
        url: url.trim() || null,
        image_url: meta?.image_url ?? null,
        brand: meta?.brand ?? null,
        price: meta?.price ?? null,
        currency: meta?.currency ?? "BRL",
        for_whom: forWhom,
        status: "wanted",
      });
      if (error) throw error;
      await logActivity({
        couple_id: couple.id, actor_id: user.id,
        activity_type: "wish_added", payload: { title: finalTitle, url: url.trim() },
      });
      toast.success("Adicionado à lista 🎁");
      setOpen(false); setUrl(""); setTitle(""); setForWhom("us");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function markPurchased(id: string) {
    const { error } = await supabase
      .from("wishlist_items")
      .update({ status: "purchased", status_date: new Date().toISOString().slice(0, 10) })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marcado como comprado!");
    load();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((s) => s.filter((w) => w.id !== id));
  }

  const wanted = items.filter((i) => i.status === "wanted");
  const purchased = items.filter((i) => i.status === "purchased");

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blush text-primary">
            <Gift className="h-5 w-5" />
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Lista de desejos</h1>
          <p className="text-sm text-muted-foreground">Cole o link de qualquer loja — Nike, Adidas, Farm... a gente busca os dados.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo desejo</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="w-url">Link do produto (opcional)</Label>
                <div className="flex gap-2">
                  <Input id="w-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                  <Button type="button" variant="outline" onClick={handleAuto} disabled={fetching || !url.trim()}>
                    <Sparkles className="mr-1 h-4 w-4" /> {fetching ? "..." : "Auto"}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-title">Título</Label>
                <Input id="w-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tênis Nike Air Force..." />
              </div>
              <div className="space-y-1.5">
                <Label>Pra quem</Label>
                <div className="flex gap-2">
                  {([
                    ["us", "Nós dois"],
                    ["her", "Pra ela"],
                    ["him", "Pra ele"],
                  ] as const).map(([k, l]) => (
                    <Button key={k} type="button" variant={forWhom === k ? "default" : "outline"} onClick={() => setForWhom(k)} className="flex-1">
                      {l}
                    </Button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting || fetching}>
                {submitting ? "Salvando..." : "Adicionar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="wanted">
        <TabsList>
          <TabsTrigger value="wanted">Desejos ({wanted.length})</TabsTrigger>
          <TabsTrigger value="purchased">Conquistados ({purchased.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="wanted" className="mt-4">
          <Grid items={wanted} onDelete={handleDelete} onPurchase={markPurchased} emptyMsg="Nada na lista ainda. Que tal o próximo presente? 🎁" />
        </TabsContent>
        <TabsContent value="purchased" className="mt-4">
          <Grid items={purchased} onDelete={handleDelete} emptyMsg="Nenhum item conquistado ainda." />
        </TabsContent>
      </Tabs>

      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
    </div>
  );
}

function Grid({
  items, onDelete, onPurchase, emptyMsg,
}: {
  items: Wish[];
  onDelete: (id: string) => void;
  onPurchase?: (id: string) => void;
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
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((w) => (
        <li key={w.id} className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] animate-float-up">
          {w.image_url ? (
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              <img src={w.image_url} alt={w.title} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-blush/30 flex items-center justify-center">
              <Gift className="h-10 w-10 text-primary/50" />
            </div>
          )}
          <div className="p-3">
            {w.brand && <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{w.brand}</p>}
            <h3 className="line-clamp-2 text-sm font-medium">{w.title}</h3>
            {w.price != null && (
              <p className="mt-1 text-sm font-semibold text-primary">
                {w.currency ?? "BRL"} {Number(w.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            )}
            <div className="mt-2 flex items-center gap-1">
              {w.url && (
                <a href={w.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" aria-label="Abrir link"><ExternalLink className="h-4 w-4" /></Button>
                </a>
              )}
              {onPurchase && (
                <Button variant="ghost" size="icon" onClick={() => onPurchase(w.id)} aria-label="Marcar como comprado">
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => onDelete(w.id)} aria-label="Excluir">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
