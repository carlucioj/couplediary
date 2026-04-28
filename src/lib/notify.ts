import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppLink } from "./utils-romance";

/** Registra uma activity no log do casal. */
export async function logActivity(params: {
  couple_id: string;
  actor_id: string;
  activity_type: string;
  payload?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("activities").insert({
    couple_id: params.couple_id,
    actor_id: params.actor_id,
    activity_type: params.activity_type,
    payload: (params.payload ?? {}) as never,
  });
  if (error) console.warn("activity log failed", error);
}

/** Abre o WhatsApp para notificar o parceiro sobre uma atualização. */
export function notifyPartnerWhatsApp(opts: {
  partnerPhone: string | null | undefined;
  message: string;
}) {
  if (typeof window === "undefined") return;
  const url = buildWhatsAppLink(opts.partnerPhone, opts.message);
  window.open(url, "_blank", "noopener,noreferrer");
}
