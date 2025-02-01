-- Create the exec_sql function for admins
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user has admin role
  IF EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.user_id
    JOIN public.roles r ON p.role_id = r.role_id
    WHERE u.id = auth.uid()
    AND r.name = 'admin'
  ) THEN
    EXECUTE sql;
  ELSE
    RAISE EXCEPTION 'Permission denied. Only admins can execute SQL.';
  END IF;
END;
$$;
