'use server';

import { createClient } from '@/lib/supabase/server';

export async function getUploadUrl(fileName: string, fileType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const filePath = `${user.id}/${Date.now()}-${fileName}`;

  // Generate a signed upload URL valid for 60 seconds
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUploadUrl(filePath);

  if (error) throw new Error(error.message);

  return { signedUrl: data.signedUrl, token: data.token, path: filePath };
}