/*
# Create profiles, roles, and admin allowlist

1. New Tables
- `profiles`: one row per signed-in Google account. Holds the display name, email, avatar, role (`student` or `teacher`) and class label (for example "Grade 9B").
- `admin_emails`: the list of school emails allowed to open the Teacher Admin Panel. Clients cannot read or edit this table directly.

2. Functions and triggers
- `is_admin()`: true when the signed-in Google email is on the admin list.
- `is_teacher()`: true for admins and for accounts whose profile role is `teacher`.
- `handle_new_user()` + trigger: creates a profile automatically the first time an account signs in.
- `admin_update_profile()`: the only way to change someone's role or class. Admins only.

3. Security
- RLS enabled on both tables.
- Students can read and update only their own name and avatar. Role and class columns are not writable by the client.
- Teachers can read all profiles in the school (needed for rosters).
- `admin_emails` has no client grants at all.

4. Notes
- No accounts or emails are seeded here. Admin emails are added separately.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
  class_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_class_label_idx ON public.profiles (class_label);

CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY CHECK (email = lower(email))
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE admin_emails.email = lower(auth.jwt() ->> 'email')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_teacher() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    lower(COALESCE(NEW.email, '')),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.admin_update_profile(p_id uuid, p_role text, p_class_label text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('student', 'teacher') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF p_class_label IS NOT NULL AND length(trim(p_class_label)) = 0 THEN
    RAISE EXCEPTION 'Invalid class';
  END IF;

  UPDATE public.profiles
  SET role = p_role,
      class_label = NULLIF(trim(p_class_label), '')
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, text) TO authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_teachers" ON public.profiles;
CREATE POLICY "profiles_select_teachers" ON public.profiles FOR SELECT
  TO authenticated USING (public.is_teacher());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
