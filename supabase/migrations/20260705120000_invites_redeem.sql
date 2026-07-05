-- =============================================================================
-- Faza 2 — Invitații: RPC de acceptare a unei invitații (redeem)
--
-- Un user care acceptă o invitație încă NU e membru al gospodăriei, deci politica
-- `members_insert` (care cere is_household_owner) l-ar bloca. La fel ca la
-- `create_household`, folosim o funcție SECURITY DEFINER care rulează cu privilegii
-- ridicate, dar validează strict codul înainte de a adăuga membrul.
--
-- Invitațiile sunt single-use (`used_at`) și pot avea expirare (`expires_at`).
-- Generarea invitației se face prin INSERT direct de către owner (politica
-- `invites_insert` o permite) — nu are nevoie de funcție specială.
-- =============================================================================

create or replace function public.redeem_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite   public.household_invites;
  v_uid      uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Neautentificat';
  end if;

  select * into v_invite
  from public.household_invites
  where code = trim(p_code);

  if not found then
    raise exception 'Cod de invitație invalid';
  end if;

  if v_invite.used_at is not null then
    raise exception 'Invitația a fost deja folosită';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'Invitația a expirat';
  end if;

  -- Dacă userul e deja membru, nu consumăm invitația — doar întoarcem gospodăria.
  if exists (
    select 1 from public.household_members
    where household_id = v_invite.household_id and user_id = v_uid
  ) then
    return v_invite.household_id;
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (v_invite.household_id, v_uid, 'member');

  update public.household_invites
  set used_at = now()
  where id = v_invite.id;

  return v_invite.household_id;
end;
$$;
