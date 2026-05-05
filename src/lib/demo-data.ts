/**
 * Dados de demonstração para rodar o app localmente sem Supabase.
 * Ativado quando VITE_DEMO_MODE=true ou via botão na tela de login.
 */

export const DEMO_USER = {
  id: "demo-user-1",
  email: "voce@demo.com",
  user_metadata: { name: "Você" },
};

export const DEMO_PARTNER = {
  user_id: "demo-user-2",
  name: "Amor",
  avatar_url: null,
  phone: null,
};

export const DEMO_ME = {
  user_id: "demo-user-1",
  name: "Você",
  avatar_url: null,
  phone: null,
};

export const DEMO_COUPLE = {
  id: "demo-couple-1",
  anniversary_date: "2022-02-14",
  invite_code: "DEMO01",
  invite_expires_at: null,
  public_handle: "voces_dois",
  public_avatar_url: null,
  public_city: "São Paulo, SP",
  is_discoverable: false,
  created_by: "demo-user-1",
};

export const DEMO_MEMORIES = [
  {
    id: "mem-1",
    memory_date: "2024-12-31",
    title: "Réveillon juntos",
    note: "Vimos os fogos na beira do rio. Foi mágico.",
    mood: "🎉",
    created_at: "2024-12-31T23:00:00Z",
  },
  {
    id: "mem-2",
    memory_date: "2024-06-12",
    title: "Dia dos Namorados",
    note: "Jantar no restaurante favorito. Pediu o risoto de funghi.",
    mood: "🍷",
    created_at: "2024-06-12T20:00:00Z",
  },
  {
    id: "mem-3",
    memory_date: "2024-02-14",
    title: "2 anos juntos",
    note: "Viagem surpresa para o litoral. Melhor fim de semana da vida.",
    mood: "💖",
    created_at: "2024-02-14T10:00:00Z",
  },
];

export const DEMO_EVENTS = [
  {
    id: "evt-1",
    title: "💖 Aniversário de namoro",
    description: "3 anos juntos!",
    starts_at: new Date(new Date().getFullYear(), 1, 14, 19, 0).toISOString(),
    ends_at: null,
    event_type: "anniversary",
  },
  {
    id: "evt-2",
    title: "🍽️ Jantar no Fasano",
    description: "Reserva às 20h",
    starts_at: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 20, 0).toISOString(),
    ends_at: null,
    event_type: "date",
  },
  {
    id: "evt-3",
    title: "✈️ Viagem para Floripa",
    description: "Voo às 7h, hotel Costão do Santinho",
    starts_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5, 7, 0).toISOString(),
    ends_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10, 22, 0).toISOString(),
    event_type: "trip",
  },
];

export const DEMO_RESTAURANTS = [
  {
    id: "rest-1",
    status: "visited",
    name: "Fasano",
    location: "Jardins, SP",
    rating: 5,
    notes: "Melhor risoto da cidade. Ambiente incrível.",
    favorite_dish: "Risoto de funghi",
    visited_at: "2024-06-12",
  },
  {
    id: "rest-2",
    status: "visited",
    name: "Chou",
    location: "Vila Madalena, SP",
    rating: 4,
    notes: "Ótimo para brunch de domingo.",
    favorite_dish: "Ovos beneditinos",
    visited_at: "2024-09-08",
  },
  {
    id: "rest-3",
    status: "wishlist",
    name: "D.O.M.",
    location: "Jardins, SP",
    rating: null,
    notes: "Alex Atala. Sonho ir um dia.",
    favorite_dish: null,
    visited_at: null,
  },
  {
    id: "rest-4",
    status: "wishlist",
    name: "Maní",
    location: "Jardins, SP",
    rating: null,
    notes: "Indicação da amiga. Culinária autoral.",
    favorite_dish: null,
    visited_at: null,
  },
];

export const DEMO_WISHLIST = [
  {
    id: "wish-1",
    title: "Air Jordan 1 Retro High OG",
    description: "Colorway Chicago. Tamanho 40.",
    url: "https://www.nike.com.br",
    image_url: null,
    brand: "Nike",
    price: 1299.99,
    currency: "BRL",
    status: "wanted",
    for_whom: "him",
  },
  {
    id: "wish-2",
    title: "Perfume Coco Mademoiselle",
    description: "Eau de Parfum 100ml",
    url: "https://www.chanel.com",
    image_url: null,
    brand: "Chanel",
    price: 890.0,
    currency: "BRL",
    status: "wanted",
    for_whom: "her",
  },
  {
    id: "wish-3",
    title: "Kindle Paperwhite",
    description: "16GB, à prova d'água",
    url: "https://www.amazon.com.br",
    image_url: null,
    brand: "Amazon",
    price: 599.0,
    currency: "BRL",
    status: "purchased",
    for_whom: "us",
  },
];

export const DEMO_FRIENDS = [
  {
    id: "friend-1",
    couple_a: "demo-couple-1",
    couple_b: "friend-couple-1",
    status: "accepted",
    requested_by: "demo-user-1",
  },
];

export const DEMO_FRIEND_COUPLES: Record<string, { id: string; public_handle: string | null; public_avatar_url: string | null; public_city: string | null }> = {
  "friend-couple-1": {
    id: "friend-couple-1",
    public_handle: "carol_e_pedro",
    public_avatar_url: null,
    public_city: "Rio de Janeiro, RJ",
  },
};

export const DEMO_SESSION_KEY = "nosso-diario-demo-mode";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_SESSION_KEY) === "true";
}

export function enableDemoMode() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_SESSION_KEY, "true");
}

export function disableDemoMode() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_SESSION_KEY);
}
