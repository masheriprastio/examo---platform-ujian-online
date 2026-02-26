import { supabase } from './supabase';

// Helper function untuk upload image ke Supabase Storage
export const uploadImageToSupabase = async (file: File, examId: string): Promise<string> => {
  try {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `exams/${examId}/${Date.now()}_${sanitizedName}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('materials')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload image: ' + uploadError.message);
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('materials')
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};
