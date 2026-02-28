import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CheckCircle, Loader2 } from 'lucide-react';

interface EssayManualScoreInputProps {
    questionId: string;
    maxPoints: number;
    currentScore?: number;    // undefined = belum dinilai
    resultId: string;         // exam_results.id
    onScoreSaved: (questionId: string, points: number) => void;
}

/**
 * Input nilai manual guru untuk soal Esai.
 * Menyimpan skor ke kolom `answers` di exam_results sebagai
 * key `{questionId}_manual_score`.
 */
const EssayManualScoreInput: React.FC<EssayManualScoreInputProps> = ({
    questionId,
    maxPoints,
    currentScore,
    resultId,
    onScoreSaved,
}) => {
    const [value, setValue] = useState<string>(currentScore !== undefined ? String(currentScore) : '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(currentScore !== undefined);

    const handleSave = async () => {
        const pts = Number(value);
        if (isNaN(pts) || pts < 0 || pts > maxPoints) {
            alert(`Nilai harus antara 0 dan ${maxPoints}.`);
            return;
        }

        setSaving(true);
        try {
            // Update answers di DB: gabungkan key manual_score ke JSON answers
            if (isSupabaseConfigured && supabase) {
                // Fetch answers terkini dulu agar tidak overwrite field lain
                const { data: row } = await supabase
                    .from('exam_results')
                    .select('answers, score')
                    .eq('id', resultId)
                    .maybeSingle();

                const currentAnswers: Record<string, any> = row?.answers || {};
                const updatedAnswers = { ...currentAnswers, [`${questionId}_manual_score`]: pts };

                // Hitung ulang total skor di sisi client sudah dilakukan via onScoreSaved
                // Kita hanya perlu update answers di DB di sini; score akan diupdate lewat callback
                await supabase
                    .from('exam_results')
                    .update({ answers: updatedAnswers })
                    .eq('id', resultId);
            }

            onScoreSaved(questionId, pts);
            setSaved(true);
        } catch (err) {
            console.error('Failed to save essay score:', err);
            alert('Gagal menyimpan nilai. Coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">
                ✏️ Penilaian Guru — Soal Esai
            </p>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                    <input
                        type="number"
                        min={0}
                        max={maxPoints}
                        value={value}
                        onChange={(e) => { setValue(e.target.value); setSaved(false); }}
                        placeholder={`0–${maxPoints}`}
                        className="w-24 px-3 py-2 rounded-xl border border-indigo-200 bg-white text-center font-black text-gray-900 text-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-gray-500">/ {maxPoints} poin</span>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || value === ''}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-md shadow-indigo-200 active:scale-95 transition-all disabled:opacity-60"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                        <><CheckCircle className="w-4 h-4" /> Tersimpan</>
                    ) : 'Simpan Nilai'}
                </button>
            </div>
            {saved && (
                <p className="text-[10px] text-indigo-500 font-bold mt-1.5">
                    ✅ Nilai esai ini sudah diperbarui dan dihitung ke skor akhir siswa.
                </p>
            )}
        </div>
    );
};

export default EssayManualScoreInput;
