-- 1. Profiles Table Policy
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Creative Profiles Table Policies (Insert + Update needed for UPSERT)
CREATE POLICY "Users can insert own creative profile"
ON public.creative_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own creative profile"
ON public.creative_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Work Samples Table Policy
CREATE POLICY "Users can insert own work samples"
ON public.work_samples
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creative_id);