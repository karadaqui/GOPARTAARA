CREATE POLICY "Admin can delete blog posts"
ON public.blog_posts
FOR DELETE
TO authenticated
USING (auth.uid() = '95e19b6b-32ec-4af8-8184-d02638ac2ded'::uuid);