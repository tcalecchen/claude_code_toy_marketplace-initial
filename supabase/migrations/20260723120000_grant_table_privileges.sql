-- Grant the table-level privileges that the existing RLS policies were written
-- to gate. RLS policies only FILTER rows; they do not GRANT the base privilege.
-- The consolidated migration created SELECT/INSERT/UPDATE/DELETE policies for the
-- `anon`/`authenticated` roles but never issued the matching GRANTs, so every
-- direct-table call (`supabase.from(...)`) failed with "permission denied for
-- table ...". Reads that go through SECURITY DEFINER RPCs were unaffected, which
-- masked the gap.
--
-- Each grant below mirrors exactly the roles + commands in pg_policies, so this
-- opens no access beyond what the policies already restrict (own rows for writes,
-- public marketplace listings for the anon SELECTs).

-- profiles: own-profile access only (never anon)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- products: publicly listable; owners manage their own rows
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- product_images: publicly viewable; owners manage images for their products
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_images TO authenticated;

-- saved_products: private bookmarks, owner-only
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_products TO authenticated;

-- messaging: authenticated participants only
GRANT SELECT, INSERT ON public.conversations TO authenticated;
GRANT SELECT ON public.participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_status TO authenticated;
