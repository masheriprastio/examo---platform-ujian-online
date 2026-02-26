import { supabase } from './lib/supabase';

async function test() {
  console.log('Testing Supabase Connection...');

  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }

  // 1. Test Select from exams
  const { data: exams, error: examError } = await supabase.from('exams').select('id').limit(1);
  if (examError) {
    console.error('Error fetching exams:', examError);
  } else {
    console.log('Exams table accessible. Count:', exams?.length);
  }

  // 2. Test Storage Upload
  console.log('Testing Storage Upload to "materials"...');
  const dummyFile = new Blob(['Hello World'], { type: 'text/plain' });
  const fileName = `test_upload_${Date.now()}.txt`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('materials')
    .upload(fileName, dummyFile);

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError);
  } else {
    console.log('Storage Upload Success:', uploadData);

    // Get Public URL
    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(fileName);
    console.log('Public URL:', urlData.publicUrl);

    // Cleanup
    const { error: deleteError } = await supabase.storage.from('materials').remove([fileName]);
    if (deleteError) console.error('Cleanup Error:', deleteError);
    else console.log('Cleanup Success');
  }
}

test();
