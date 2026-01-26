-- Create helper to check admin role without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result BOOLEAN := FALSE;
BEGIN
  SELECT TRUE INTO result
  FROM public.staff_users
  WHERE user_id = auth.uid()
    AND role = 'admin'
  LIMIT 1;

  RETURN COALESCE(result, FALSE);
END;
$$;

-- Replace staff_users policies to avoid recursion
DROP POLICY IF EXISTS "staff_users admin manage" ON public.staff_users;
DROP POLICY IF EXISTS "staff_users read own" ON public.staff_users;

CREATE POLICY "staff_users read own"
ON public.staff_users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "staff_users admin insert"
ON public.staff_users
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "staff_users admin update"
ON public.staff_users
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "staff_users admin delete"
ON public.staff_users
FOR DELETE
USING (public.is_admin());
