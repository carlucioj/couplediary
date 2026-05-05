/**
 * Utilitários de eventos — sem dependências de browser,
 * reutilizáveis futuramente em React Native.
 */

export type EventType = "anniversary" | "trip" | "date" | "memory" | "reminder";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  event_type: string;
};

export const EVENT_CONFIG: Record<
  EventType,
  { emoji: string; label: string; color: string; bg: string; border: string }
> = {
  anniversary: {
    emoji: "💖",
    label: "Aniversário",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-900/40",
    border: "border-pink-300 dark:border-pink-700",
  },
  trip: {
    emoji: "✈️",
    label: "Viagem",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    border: "border-blue-300 dark:border-blue-700",
  },
  date: {
    emoji: "🍷",
    label: "Encontro",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-900/40",
    border: "border-violet-300 dark:border-violet-700",
  },
  memory: {
    emoji: "📸",
    label: "Memória",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    border: "border-amber-300 dark:border-amber-700",
  },
  reminder: {
    emoji: "🔔",
    label: "Lembrete",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    border: "border-emerald-300 dark:border-emerald-700",
  },
};

export const FALLBACK_CONFIG = {
  emoji: "📅",
  label: "Evento",
  color: "text-muted-foreground",
  bg: "bg-muted",
  border: "border-border",
};

export function getEventConfig(type: string) {
  return EVENT_CONFIG[type as EventType] ?? FALLBACK_CONFIG;
}

/** Gera conteúdo de arquivo .ics (RFC 5545) para um evento */
export function generateICS(event: CalendarEvent): string {
  const start = new Date(event.starts_at);
  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]|\.\d{3}/g, "").slice(0, 15) + "Z";

  const escapeICS = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nosso Diário//PT",
    "BEGIN:VEVENT",
    `UID:${event.id}@nosso-diario`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    event.description ? `DESCRIPTION:${escapeICS(event.description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return lines;
}

/** Faz download de um arquivo .ics no browser */
export function downloadICS(event: CalendarEvent) {
  const content = generateICS(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nosso-diario-${event.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Gera URL do Google Calendar para um evento */
export function googleCalendarURL(event: CalendarEvent): string {
  const start = new Date(event.starts_at);
  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Formata data para chave YYYY-MM-DD */
export function toYMD(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
