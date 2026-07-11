-- =============================================================================
-- Datorii integrate în soldul lunii
--
-- Fiecare mișcare de bani a unei datorii creează o tranzacție reală (source='debt'),
-- ca să intre în calculele lunii:
--   • Împrumut inițial:  borrowed → venit (primesc bani) · lent → cheltuială (dau bani)
--   • Restituire (invers): borrowed → cheltuială · lent → venit
--
-- Tranzacțiile folosesc o categorie „Datorii" creată lazy per gospodărie (din cod).
-- Legăturile `transaction_id` permit ștergerea/actualizarea în cascadă din acțiuni.
-- =============================================================================

alter type public.transaction_source add value if not exists 'debt';

alter table public.debts
  add column if not exists transaction_id uuid references public.transactions (id);

alter table public.debt_payments
  add column if not exists transaction_id uuid references public.transactions (id);
