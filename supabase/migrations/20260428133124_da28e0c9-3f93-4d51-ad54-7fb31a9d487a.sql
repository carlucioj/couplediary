
REVOKE EXECUTE ON FUNCTION public.is_couple_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_couple_id(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.are_couples_friends(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
