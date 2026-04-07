
DROP POLICY "Authenticated users can view avatars" ON storage.objects;
CREATE POLICY "Users can view their own avatar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
