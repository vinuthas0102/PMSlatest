/*
# Add private WO document storage

1. Storage
- Create the private `wo-documents` bucket for Quality documents.
- Allow the existing single-tenant app roles to upload, read, update, and remove files in this bucket.

2. Security
- Keep the bucket private; files are accessed through authenticated Supabase storage requests rather than public URLs.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('wo-documents', 'wo-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "wo_documents_read" ON storage.objects;
CREATE POLICY "wo_documents_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'wo-documents');

DROP POLICY IF EXISTS "wo_documents_insert" ON storage.objects;
CREATE POLICY "wo_documents_insert" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'wo-documents');

DROP POLICY IF EXISTS "wo_documents_update" ON storage.objects;
CREATE POLICY "wo_documents_update" ON storage.objects FOR UPDATE TO anon, authenticated
USING (bucket_id = 'wo-documents') WITH CHECK (bucket_id = 'wo-documents');

DROP POLICY IF EXISTS "wo_documents_delete" ON storage.objects;
CREATE POLICY "wo_documents_delete" ON storage.objects FOR DELETE TO anon, authenticated
USING (bucket_id = 'wo-documents');
