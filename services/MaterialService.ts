import { supabase } from '../lib/supabase';

export interface Material {
  id: string;
  title: string;
  description: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  category: string;
  grade?: string;
  subject?: string;
  isPublic: boolean;
}

export class MaterialService {
  private static readonly BUCKET_NAME = 'materials';

  private static normalizeMaterial(record: any): Material {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      fileName: record.file_name ?? record.fileName,
      mimeType: record.mime_type ?? record.mimeType ?? 'application/octet-stream',
      fileSize: record.file_size ?? record.fileSize ?? 0,
      fileUrl: record.file_url ?? record.fileUrl,
      uploadedBy: record.uploaded_by ?? record.uploadedBy,
      uploadedAt: record.uploaded_at ?? record.uploadedAt,
      category: record.category,
      grade: record.grade ?? undefined,
      subject: record.subject ?? undefined,
      isPublic: record.is_public ?? record.isPublic ?? false
    };
  }

  static async getAllMaterials(): Promise<Material[]> {
    // OPTIMIZATION: Select only needed columns, not all columns with * 
    // Also add limit for Free Tier performance
    const { data, error } = await supabase
      .from('materials')
      .select('id, title, description, file_name, mime_type, file_size, file_url, uploaded_by, uploaded_at, category, grade, subject, is_public')
      .order('uploaded_at', { ascending: false })
      .limit(100); // Reasonable limit for materials

    if (error) {
      console.error('[Materials] Failed to fetch:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    console.log('[Materials] Loaded', data.length, 'materials (optimized query)');
    return data.map(this.normalizeMaterial);
  }

  static async uploadMaterial(
    file: File,
    title: string,
    description: string,
    category: string,
    grade?: string,
    subject?: string
  ): Promise<Material> {
    // Generate unique file name
    const fileName = `${Date.now()}_${file.name}`;
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload file: ' + uploadError.message);
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    // Insert metadata to database
    const { data, error } = await supabase
      .from('materials')
      .insert({
        title,
        description,
        file_name: fileName,
        mime_type: file.type,
        file_size: file.size,
        file_url: publicUrlData.publicUrl,
        uploaded_by: 'teacher_id', // Replace with actual user ID
        uploaded_at: new Date().toISOString(), // Timestamp upload
        category,
        grade,
        subject,
        is_public: true
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
      throw new Error('Failed to save material metadata: ' + error.message);
    }

    return this.normalizeMaterial(data);
  }

  static async deleteMaterial(materialId: string): Promise<void> {
    // Get material info first
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('file_name')
      .eq('id', materialId)
      .single();

    if (fetchError || !material) {
      throw new Error('Material not found');
    }

    // Delete from storage
    const { error: deleteError } = await supabase
      .storage
      .from(this.BUCKET_NAME)
      .remove([material.file_name]);

    if (deleteError) {
      console.warn('Failed to delete file from storage:', deleteError.message);
    }

    // Delete from database
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId);

    if (error) {
      throw new Error('Failed to delete material: ' + error.message);
    }
  }

  static async downloadMaterial(materialId: string): Promise<string> {
    const { data, error } = await supabase
      .from('materials')
      .select('file_url')
      .eq('id', materialId)
      .single();

    if (error || !data) {
      throw new Error('Material not found');
    }

    return data.file_url;
  }

  static async updateMaterial(
    id: string,
    updates: Partial<Omit<Material, 'id' | 'uploadedBy' | 'uploadedAt' | 'fileUrl' | 'fileName' | 'fileSize' | 'mimeType'>>
  ): Promise<Material> {
    const { data, error } = await supabase
      .from('materials')
      .update({
        title: updates.title,
        description: updates.description,
        category: updates.category,
        grade: updates.grade,
        subject: updates.subject,
        is_public: updates.isPublic
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update material: ' + error.message);
    }

    return this.normalizeMaterial(data);
  }
}
