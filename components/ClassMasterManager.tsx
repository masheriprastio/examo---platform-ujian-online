import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { generateUUID } from '../lib/uuid';
import { Download, Plus, Trash2, Upload, Users } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface ClassStudent {
  no: number;
  name: string;
}

interface ClassMasterRecord {
  id: string;
  className: string;
  sourceFile: string;
  importedAt: string;
  students: ClassStudent[];
}

interface ManualStudentRow {
  id: string;
  no: string;
  name: string;
}

const STORAGE_KEY = 'examo_class_master_records';

const normalizeCell = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const firstNonEmptyAfter = (row: unknown[], startIndex: number) => {
  for (let i = startIndex + 1; i < row.length; i += 1) {
    const val = String(row[i] || '').trim();
    if (val) return val;
  }
  return '';
};

const parseClassSheet = (rows: unknown[][], sourceFile: string): Omit<ClassMasterRecord, 'id' | 'importedAt'> => {
  if (!rows.length) {
    throw new Error('Sheet kosong.');
  }

  // Format 1 (baru): tabel kolom, contoh:
  // No | Nama Siswa | Kelas
  // 1  | ...        | X-1
  let flatHeaderRowIndex = -1;
  let flatNoCol = -1;
  let flatNameCol = -1;
  let flatClassCol = -1;

  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const normalizedRow = row.map(normalizeCell);
    const idxNo = normalizedRow.findIndex(v => v === 'no');
    const idxName = normalizedRow.findIndex(v => v === 'nama siswa' || v === 'nama');
    if (idxNo !== -1 && idxName !== -1) {
      flatHeaderRowIndex = r;
      flatNoCol = idxNo;
      flatNameCol = idxName;
      flatClassCol = normalizedRow.findIndex(v => v === 'kelas' || v === 'absensi kelas');
      break;
    }
  }

  if (flatHeaderRowIndex !== -1) {
    const students: ClassStudent[] = [];
    let classNameFromRows = '';
    let emptyStreak = 0;

    for (let i = flatHeaderRowIndex + 1; i < rows.length; i += 1) {
      const row = rows[i] || [];
      const rawName = String(row[flatNameCol] || '').trim();
      const rawNo = String(row[flatNoCol] || '').trim();
      const rawClass = flatClassCol !== -1 ? String(row[flatClassCol] || '').trim() : '';

      if (!rawName) {
        emptyStreak += 1;
        if (emptyStreak >= 5) break;
        continue;
      }
      emptyStreak = 0;

      const noParsed = Number.parseInt(rawNo, 10);
      students.push({
        no: Number.isFinite(noParsed) ? noParsed : students.length + 1,
        name: rawName
      });

      if (!classNameFromRows && rawClass) classNameFromRows = rawClass;
    }

    if (students.length > 0) {
      const cleanFileName = sourceFile.replace(/\.[^/.]+$/, '');
      return {
        className: classNameFromRows || cleanFileName || 'Kelas Tanpa Nama',
        sourceFile,
        students
      };
    }
  }

  // Format 2 (lama): label "Absensi Kelas :" + header "No | Nama Siswa"
  let className = '';
  let headerRowIndex = -1;
  let noCol = -1;
  let nameCol = -1;

  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const normalized = normalizeCell(cell);
      if (!normalized) return;

      if (!className && normalized.includes('absensi kelas')) {
        className = firstNonEmptyAfter(row, colIndex);
      }
      if (headerRowIndex === -1 && normalized === 'no') {
        const candidateName = normalizeCell(row[colIndex + 1] || '');
        if (candidateName.includes('nama siswa')) {
          headerRowIndex = rowIndex;
          noCol = colIndex;
          nameCol = colIndex + 1;
        }
      }
    });
  });

  if (headerRowIndex === -1 || noCol === -1 || nameCol === -1) {
    throw new Error('Header "No" dan "Nama Siswa" tidak ditemukan.');
  }

  const students: ClassStudent[] = [];
  let emptyStreak = 0;

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const rawName = String(row[nameCol] || '').trim();
    const rawNo = String(row[noCol] || '').trim();

    if (!rawName) {
      emptyStreak += 1;
      if (emptyStreak >= 5) break;
      continue;
    }
    emptyStreak = 0;

    if (normalizeCell(rawName).includes('nama siswa')) {
      continue;
    }

    const noParsed = Number.parseInt(rawNo, 10);
    students.push({
      no: Number.isFinite(noParsed) ? noParsed : students.length + 1,
      name: rawName
    });
  }

  if (students.length === 0) {
    throw new Error('Tidak ada data siswa yang valid pada sheet.');
  }

  const cleanFileName = sourceFile.replace(/\.[^/.]+$/, '');
  return {
    className: className || cleanFileName || 'Kelas Tanpa Nama',
    sourceFile,
    students
  };
};

const ClassMasterManager: React.FC = () => {
  const [records, setRecords] = useState<ClassMasterRecord[]>([]);
  const [previewRecord, setPreviewRecord] = useState<Omit<ClassMasterRecord, 'id' | 'importedAt'> | null>(null);
  const [errorText, setErrorText] = useState('');
  const [infoText, setInfoText] = useState('');
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [manualClassName, setManualClassName] = useState('');
  const [manualRows, setManualRows] = useState<ManualStudentRow[]>([
    { id: generateUUID(), no: '1', name: '' }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadClassMaster = async () => {
      setErrorText('');
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ClassMasterRecord[];
          if (Array.isArray(parsed) && isMounted) {
            setRecords(parsed);
          }
        }
      } catch {
        // ignore broken localStorage
      }

      if (!isSupabaseConfigured || !supabase) return;

      try {
        const { data, error } = await supabase
          .from('class_master_records')
          .select('*')
          .order('imported_at', { ascending: false });

        if (error) {
          if (isMounted) {
            setInfoText('Data kelas menggunakan penyimpanan lokal (tabel class_master_records belum tersedia).');
          }
          return;
        }

        const mapped = (data || []).map((row: any) => ({
          id: String(row.id),
          className: String(row.class_name || row.className || '').trim() || 'Kelas Tanpa Nama',
          sourceFile: String(row.source_file || row.sourceFile || '-'),
          importedAt: String(row.imported_at || row.importedAt || new Date().toISOString()),
          students: Array.isArray(row.students)
            ? row.students.map((student: any, index: number) => ({
              no: Number(student?.no) || index + 1,
              name: String(student?.name || '').trim()
            })).filter((student: ClassStudent) => student.name)
            : []
        }));

        if (isMounted) {
          setRecords(mapped);
          setInfoText('');
        }
      } catch {
        if (isMounted) {
          setInfoText('Gagal sinkronisasi ke basis data, data lokal tetap dapat digunakan.');
        }
      }
    };

    void loadClassMaster();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore storage write errors
    }
  }, [records]);

  const totalStudents = useMemo(
    () => records.reduce((sum, record) => sum + record.students.length, 0),
    [records]
  );

  const handleChooseFile = () => fileInputRef.current?.click();

  const handleFileUpload = async (file: File) => {
    setErrorText('');
    setPreviewRecord(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error('Sheet tidak ditemukan di file.');
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];

      const parsed = parseClassSheet(rows, file.name);
      setPreviewRecord(parsed);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Gagal membaca file.');
    }
  };

  const persistClassRecord = (record: Omit<ClassMasterRecord, 'id' | 'importedAt'>) => {
    const payload: ClassMasterRecord = {
      ...record,
      id: generateUUID(),
      importedAt: new Date().toISOString()
    };
    setRecords(prev => [payload, ...prev.filter(record => record.className !== payload.className)]);

    if (!isSupabaseConfigured || !supabase) {
      setInfoText('Data kelas disimpan lokal (mode mock).');
      return;
    }

    void (async () => {
      const dbPayload = {
        id: payload.id,
        class_name: payload.className,
        source_file: payload.sourceFile,
        imported_at: payload.importedAt,
        students: payload.students
      };

      let errorMessage = '';
      try {
        const existingRowsRes = await supabase
          .from('class_master_records')
          .select('id')
          .eq('class_name', payload.className);
        const existingRows = existingRowsRes.data || [];

        if (!existingRowsRes.error && existingRows.length > 0) {
          const existingIds = existingRows.map((row: any) => String(row.id));
          const deleteStudentsRes = await supabase
            .from('class_master_students')
            .delete()
            .in('class_master_id', existingIds);
          if (deleteStudentsRes.error && !/class_master_students/i.test(deleteStudentsRes.error.message || '')) {
            errorMessage = deleteStudentsRes.error.message;
          }
        }

        const deleteRes = await supabase
          .from('class_master_records')
          .delete()
          .eq('class_name', payload.className);
        if (!errorMessage && deleteRes.error) {
          errorMessage = deleteRes.error.message;
        }

        if (!errorMessage) {
          const insertRes = await supabase.from('class_master_records').insert(dbPayload);
          if (insertRes.error) errorMessage = insertRes.error.message;
        }

        if (!errorMessage) {
          const studentRows = payload.students.map((student, idx) => ({
            id: generateUUID(),
            class_master_id: payload.id,
            class_name: payload.className,
            student_name: student.name,
            student_no: student.no || idx + 1,
            student_code: null
          }));

          if (studentRows.length > 0) {
            const insertStudentsRes = await supabase
              .from('class_master_students')
              .insert(studentRows);
            if (insertStudentsRes.error && !/class_master_students/i.test(insertStudentsRes.error.message || '')) {
              errorMessage = insertStudentsRes.error.message;
            }
          }
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Unknown error';
      }

      if (errorMessage) {
        setErrorText(`Data tersimpan lokal, namun gagal sinkron ke basis data: ${errorMessage}`);
      }
    })();
  };

  const savePreview = () => {
    if (!previewRecord) return;
    setErrorText('');
    setInfoText('');
    persistClassRecord(previewRecord);
    setPreviewRecord(null);
  };

  const addManualRow = () => {
    setManualRows(prev => [
      ...prev,
      { id: generateUUID(), no: String(prev.length + 1), name: '' }
    ]);
  };

  const updateManualRow = (rowId: string, field: 'no' | 'name', value: string) => {
    setManualRows(prev => prev.map(row => (
      row.id === rowId ? { ...row, [field]: value } : row
    )));
  };

  const deleteManualRow = (rowId: string) => {
    setManualRows(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(row => row.id !== rowId);
    });
  };

  const saveManualData = () => {
    setErrorText('');
    setInfoText('');

    const className = manualClassName.trim();
    if (!className) {
      setErrorText('Nama kelas wajib diisi untuk input manual.');
      return;
    }

    const students = manualRows
      .map((row, idx) => {
        const cleanName = row.name.trim();
        if (!cleanName) return null;
        const parsedNo = Number.parseInt(row.no, 10);
        return {
          no: Number.isFinite(parsedNo) ? parsedNo : idx + 1,
          name: cleanName
        };
      })
      .filter((row): row is ClassStudent => Boolean(row));

    if (students.length === 0) {
      setErrorText('Minimal isi 1 nama siswa pada input manual.');
      return;
    }

    persistClassRecord({
      className,
      sourceFile: 'Input Manual',
      students
    });

    setManualClassName('');
    setManualRows([{ id: generateUUID(), no: '1', name: '' }]);
  };

  const handleDeleteRecord = (recordId: string) => {
    const prevRecords = records;
    setRecords(prev => prev.filter(item => item.id !== recordId));

    if (!isSupabaseConfigured || !supabase) return;

    void (async () => {
      try {
        const deleteStudentsRes = await supabase
          .from('class_master_students')
          .delete()
          .eq('class_master_id', recordId);
        if (deleteStudentsRes.error && !/class_master_students/i.test(deleteStudentsRes.error.message || '')) {
          setRecords(prevRecords);
          setErrorText(`Gagal menghapus dari basis data: ${deleteStudentsRes.error.message}`);
          return;
        }

        const { error } = await supabase
          .from('class_master_records')
          .delete()
          .eq('id', recordId);
        if (error) {
          setRecords(prevRecords);
          setErrorText(`Gagal menghapus dari basis data: ${error.message}`);
        }
      } catch (err) {
        setRecords(prevRecords);
        setErrorText(`Gagal menghapus dari basis data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    })();
  };

  const downloadTemplate = () => {
    // Format tabel kolom dipisah titik-koma (;) bukan koma (,)
    const csvRows = [
      ['No', 'Nama Siswa', 'Kelas'],
      ['1', 'Alifah Rahil Saffadillah', 'X-1'],
      ['2', 'Aqila Syawalia', 'X-1'],
      ['3', 'Crissandha Sachi Maulidya', 'X-1']
    ];
    const csv = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_master_kelas.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Master Data Kelas</h1>
          <p className="text-gray-400">Upload data kelas dari Excel/Spreadsheet dengan format absensi.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="px-5 py-3 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-black hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Unduh Template
          </button>
          <button
            onClick={handleChooseFile}
            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Upload className="w-4 h-4" /> Import Excel/CSV
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void handleFileUpload(file);
            }
            e.currentTarget.value = '';
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-indigo-600 text-white rounded-3xl p-6">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-100">Total Kelas</p>
          <p className="text-4xl font-black mt-2">{records.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-3xl p-6">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total Siswa</p>
          <p className="text-4xl font-black mt-2 text-gray-900">{totalStudents}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-3xl p-6">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Format Upload</p>
          <p className="text-sm font-bold mt-3 text-gray-700 leading-relaxed">
            Disarankan format tabel kolom:
            <span className="text-indigo-600"> No</span>, <span className="text-indigo-600">Nama Siswa</span>,
            <span className="text-indigo-600"> Kelas</span>.
            Template CSV menggunakan pemisah <span className="text-indigo-600">;</span> (bukan koma).
          </p>
        </div>
      </div>

      <div className="mb-8 bg-white border border-gray-100 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Input Manual</p>
            <h3 className="text-lg font-black text-gray-900">Tambah Data Kelas Tanpa File</h3>
          </div>
          <button
            onClick={addManualRow}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 font-bold text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Baris
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Kelas</label>
            <input
              type="text"
              value={manualClassName}
              onChange={(e) => setManualClassName(e.target.value)}
              placeholder="Contoh: X-1"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <button
              onClick={saveManualData}
              className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all"
            >
              Simpan Input Manual
            </button>
          </div>
        </div>

        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase w-24">No</th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase">Nama Siswa</th>
                <th className="px-4 py-3 text-right text-xs font-black text-gray-400 uppercase w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {manualRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min={1}
                      value={row.no}
                      onChange={(e) => updateManualRow(row.id, 'no', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateManualRow(row.id, 'name', e.target.value)}
                      placeholder="Nama siswa"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => deleteManualRow(row.id)}
                      disabled={manualRows.length <= 1}
                      className="inline-flex p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {infoText && (
        <div className="mb-6 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-2xl font-bold text-sm">
          {infoText}
        </div>
      )}

      {errorText && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl font-bold text-sm">
          {errorText}
        </div>
      )}

      {previewRecord && (
        <div className="mb-8 bg-white border-2 border-indigo-200 rounded-3xl p-6">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">Preview Import</p>
          <h3 className="text-xl font-black text-gray-900">{previewRecord.className}</h3>
          <p className="text-sm text-gray-500 font-bold">{previewRecord.students.length} siswa</p>

          <div className="mt-4 max-h-72 overflow-auto border border-gray-100 rounded-2xl">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase">No</th>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase">Nama Siswa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewRecord.students.map((student) => (
                  <tr key={`${student.no}-${student.name}`}>
                    <td className="px-4 py-3 font-black text-gray-600">{student.no}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{student.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={savePreview}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all"
            >
              Simpan ke Master
            </button>
            <button
              onClick={() => setPreviewRecord(null)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-400">Belum ada data kelas. Import file Excel/CSV untuk memulai.</p>
          </div>
        ) : (
          records.map(record => (
            <div key={record.id} className="bg-white rounded-3xl border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl font-black text-gray-900">{record.className}</h4>
                  <p className="text-sm font-bold text-gray-500 mt-1">
                    {record.students.length} siswa • File: {record.sourceFile}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedClassId(prev => prev === record.id ? null : record.id)}
                    className="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs hover:bg-indigo-100 transition-all"
                  >
                    {expandedClassId === record.id ? 'Sembunyikan Detail' : 'Lihat Detail'}
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                    title="Hapus data kelas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedClassId === record.id && (
                <div className="mt-5 border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase">No</th>
                          <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase">Nama Siswa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {record.students.map(student => (
                          <tr key={`${record.id}-${student.no}-${student.name}`}>
                            <td className="px-4 py-3 font-black text-gray-600">{student.no}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{student.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClassMasterManager;
