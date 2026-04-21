-- Allows joining a trip by invite code without exposing all trips via SELECT.

drop function if exists public.join_trip_by_invite(text);

create or replace function public.join_trip_by_invite(p_invite_code text)
returns table (trip_id uuid, status text)
language sql
security definer
set search_path = public
as $join_trip$
with me as (
  select auth.uid() as uid
),
trip as (
  select t.id
  from public.trips t
  where t.invite_code = upper(trim(p_invite_code))
  limit 1
),
ins as (
  insert into public.trip_members (trip_id, user_id, role)
  select trip.id, me.uid, 'member'
  from trip
  cross join me
  where me.uid is not null
    and not exists (
      select 1
      from public.trip_members tm
      where tm.trip_id = trip.id
        and tm.user_id = me.uid
    )
  on conflict (trip_id, user_id) do nothing
  returning trip_id
)
select
  (select id from trip) as trip_id,
  case
    when (select uid from me) is null then 'NOT_AUTHENTICATED'
    when not exists (select 1 from trip) then 'INVALID_INVITE_CODE'
    when exists (select 1 from ins) then 'JOINED'
    else 'ALREADY_MEMBER'
  end as status;
$join_trip$;

grant execute on function public.join_trip_by_invite(text) to authenticated;
