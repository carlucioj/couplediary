import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

export type Couple = {
  id: string;
  anniversary_date: string;
  invite_code: string | null;
  invite_expires_at: string | null;
  public_handle: string | null;
  public_avatar_url: string | null;
  public_city: string | null;
  is_discoverable: boolean;
  created_by: string;
};

export type Profile = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
};

export function useCouple() {
  const { user } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCouple(null);
      setPartner(null);
      setMe(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch user's couple via couple_members
    const { data: membership } = await supabase
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setCouple(null);
      setPartner(null);
      setMe(profile ?? null);
      setLoading(false);
      return;
    }

    const [coupleRes, profilesRes] = await Promise.all([
      supabase.from("couples").select("*").eq("id", membership.couple_id).maybeSingle(),
      supabase
        .from("couple_members")
        .select("user_id, profiles(user_id, name, avatar_url, phone)")
        .eq("couple_id", membership.couple_id),
    ]);

    setCouple(coupleRes.data as Couple | null);

    const profiles = (profilesRes.data ?? [])
      .map((row) => row.profiles as unknown as Profile)
      .filter(Boolean);
    setMe(profiles.find((p) => p.user_id === user.id) ?? null);
    setPartner(profiles.find((p) => p.user_id !== user.id) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { couple, partner, me, loading, refresh };
}
