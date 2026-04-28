import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Search, Heart, Check, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useCouple } from "@/lib/use-couple";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/friends")({
  head: () => ({ meta: [{ title: "Casais conectados — Nosso Diário" }] }),
  component: () => (
    <AppShell>
      <FriendsPage />
    </AppShell>
  ),
});

type DiscoverableCouple = {
  id: string;
  public_handle: string | null;
  public_avatar_url: string | null;
  public_city: string | null;
};

type Friendship = {
  id: string;
  couple_a: string;
  couple_b: string;
  status: string;
  requested_by: string;
};

function FriendsPage() {
  const { user } = useAuth();
  const { couple, refresh } = useCouple();
  const [handle, setHandle] = useState("");
  const [city, setCity] = useState("");
  const [discoverable, setDiscoverable] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<DiscoverableCouple[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [friendCouples, setFriendCouples] = useState<Record<string, DiscoverableCouple>>({});

  useEffect(() => {
    if (couple) {
      setHandle(couple.public_handle ?? "");
      setCity(couple.public_city ?? "");
      setDiscoverable(couple.is_discoverable);
    }
  }, [couple]);

  async function loadFriendships() {
    if (!couple) return;
    const { data } = await supabase
      .from("couple_friendships")
      .select("id, couple_a, couple_b, status, requested_by");
    const list = (data ?? []) as Friendship[];
    setFriendships(list);

    const otherIds = Array.from(new Set(list.map((f) => (f.couple_a === couple.id ? f.couple_b : f.couple_a))));
    if (otherIds.length) {
      const { data: cs } = await supabase
        .from("couples")
        .select("id, public_handle, public_avatar_url, public_city")
        .in("id", otherIds);
      const map: Record<string, DiscoverableCouple> = {};
      for (const c of (cs ?? []) as DiscoverableCouple[]) map[c.id] = c;
      setFriendCouples(map);
    }
  }

  useEffect(() => {
    loadFriendships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id]);

  async function saveProfile() {
    if (!couple) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("couples")
        .update({
          public_handle: handle.trim() || null,
          public_city: city.trim() || null,
          is_discoverable: discoverable,
        })
        .eq("id", couple.id);
      if (error) throw error;
      toast.success("Perfil público atualizado");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSavingProfile(false);
    }
  }

  async function doSearch() {
    if (!search.trim()) return;
    const { data, error } = await supabase
      .from("couples")
      .select("id, public_handle, public_avatar_url, public_city")
      .eq("is_discoverable", true)
      .ilike("public_handle", `%${search.trim()}%`)
      .limit(20);
    if (error) return toast.error(error.message);
    setResults(((data ?? []) as DiscoverableCouple[]).filter((c) => c.id !== couple?.id));
  }

  async function sendRequest(otherId: string) {
    if (!couple || !user) return;
    const { error } = await supabase.from("couple_friendships").insert({
      couple_a: couple.id,
      couple_b: otherId,
      requested_by: user.id,
      status: "pending",
    });
    if (error) return toast.error(error.message);
    toast.success("Pedido enviado 💌");
    loadFriendships();
  }

  async function accept(id: string) {
    const { error } = await supabase.from("couple_friendships").update({ status: "accepted" }).eq("id", id);
    if (error) return toast.error(error.message);
    loadFriendships();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("couple_friendships").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadFriendships();
  }

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter((f) => f.status === "pending" && f.requested_by !== user?.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requested_by === user?.id);

  return (
    <div className="space-y-8">
      <header>
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blush text-primary">
          <Users className="h-5 w-5" />
        </div>
        <h1 className="mt-2 text-2xl font-semibold">Casais conectados</h1>
        <p className="text-sm text-muted-foreground">Conecte-se com outros casais — só o que vocês decidirem compartilhar fica visível.</p>
      </header>

      <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-semibold">Perfil público do casal</h2>
        <p className="mt-1 text-xs text-muted-foreground">Tudo isso é opcional. Se desativar a descoberta, ninguém encontra vocês.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="f-handle">Apelido do casal</Label>
            <Input id="f-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="ana_e_joao" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-city">Cidade</Label>
            <Input id="f-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo, SP" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <Label htmlFor="f-disc">Aparecer na busca</Label>
            <p className="text-xs text-muted-foreground">Permitir que outros casais encontrem vocês pelo apelido.</p>
          </div>
          <Switch id="f-disc" checked={discoverable} onCheckedChange={setDiscoverable} />
        </div>
        <Button className="mt-4" onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? "Salvando..." : "Salvar"}
        </Button>
      </section>

      <section>
        <h2 className="font-semibold">Buscar casais</h2>
        <div className="mt-3 flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por apelido..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), doSearch())} />
          <Button onClick={doSearch}><Search className="mr-1 h-4 w-4" /> Buscar</Button>
        </div>
        {results.length > 0 && (
          <ul className="mt-3 space-y-2">
            {results.map((c) => {
              const already = friendships.some((f) => f.couple_a === c.id || f.couple_b === c.id);
              return (
                <li key={c.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
                  <div>
                    <p className="font-medium">@{c.public_handle ?? "casal"}</p>
                    {c.public_city && <p className="text-xs text-muted-foreground">{c.public_city}</p>}
                  </div>
                  <Button size="sm" variant={already ? "outline" : "default"} disabled={already} onClick={() => sendRequest(c.id)}>
                    <UserPlus className="mr-1 h-4 w-4" /> {already ? "Conectado" : "Conectar"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {incoming.length > 0 && (
        <section>
          <h2 className="font-semibold">Pedidos recebidos</h2>
          <ul className="mt-3 space-y-2">
            {incoming.map((f) => {
              const other = friendCouples[f.couple_a === couple?.id ? f.couple_b : f.couple_a];
              return (
                <li key={f.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
                  <p className="font-medium">@{other?.public_handle ?? "casal"}</p>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => accept(f.id)}><Check className="mr-1 h-4 w-4" /> Aceitar</Button>
                    <Button size="sm" variant="outline" onClick={() => remove(f.id)}><X className="h-4 w-4" /></Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-semibold">Conectados ({accepted.length})</h2>
        {accepted.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Vocês ainda não estão conectados com outros casais.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {accepted.map((f) => {
              const other = friendCouples[f.couple_a === couple?.id ? f.couple_b : f.couple_a];
              return (
                <li key={f.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 fill-primary text-primary" />
                    <div>
                      <p className="font-medium">@{other?.public_handle ?? "casal"}</p>
                      {other?.public_city && <p className="text-xs text-muted-foreground">{other.public_city}</p>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(f.id)}><X className="h-4 w-4" /></Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section>
          <h2 className="font-semibold">Pedidos enviados</h2>
          <ul className="mt-3 space-y-2">
            {outgoing.map((f) => {
              const other = friendCouples[f.couple_a === couple?.id ? f.couple_b : f.couple_a];
              return (
                <li key={f.id} className="flex items-center justify-between rounded-xl border bg-card p-3 text-sm">
                  <p>@{other?.public_handle ?? "casal"} — aguardando</p>
                  <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>Cancelar</Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
