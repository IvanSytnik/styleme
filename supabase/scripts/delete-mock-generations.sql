-- Removes synthetic generations written by the Replicate mock.
--
-- Not a migration: run once, by hand, in the SQL editor of the affected
-- project. Real generations store an https URL from the model provider; the
-- mock stores an inline `data:image/...` URL, which no real generation has.
--
-- 1. Run as is. It previews, deletes inside a transaction, and ROLLS BACK.
-- 2. Check that the deleted count matches the preview.
-- 3. Change ROLLBACK to COMMIT and run again.
--
-- Hard delete on purpose: these rows were never real generations and carry
-- no billing meaning, so soft delete would only keep junk in the table.

begin;

-- Preview
select count(*) as mock_rows,
       min(created_at) as first_seen,
       max(created_at) as last_seen,
       count(distinct user_id) as users
from public.generations
where result_url like 'data:image/%';

-- Delete
delete from public.generations
where result_url like 'data:image/%'
returning id, user_id, created_at;

rollback; -- change to COMMIT after checking the count
