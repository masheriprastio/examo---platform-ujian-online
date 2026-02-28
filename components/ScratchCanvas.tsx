
/**
 * ScratchCanvas – Papan coretan matematika untuk siswa
 * Mendukung: touch jari (Android/iOS), stylus, mouse
 * Fitur: multi-warna, undo, clear, resize-aware
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eraser, Trash2, Undo2, Pencil, Minus, Plus } from 'lucide-react';

interface ScratchCanvasProps {
    /** Dipanggil setiap kali canvas berubah, menyimpan data-URL (untuk autosave opsional) */
    onChange?: (dataUrl: string) => void;
    /** Data URL awal jika ada progress sebelumnya */
    initialDataUrl?: string;
}

type Tool = 'pen' | 'eraser';

const COLORS = ['#1e1b4b', '#dc2626', '#16a34a', '#2563eb', '#d97706', '#7c3aed'];
const PEN_SIZES = [2, 4, 7, 12];
const ERASER_SIZE = 32;

const ScratchCanvas: React.FC<ScratchCanvasProps> = ({ onChange, initialDataUrl }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const history = useRef<ImageData[]>([]);
    const MAX_HISTORY = 40;

    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState(COLORS[0]);
    const [sizeIdx, setSizeIdx] = useState(1); // default pen size index

    const currentSize = tool === 'eraser' ? ERASER_SIZE : PEN_SIZES[sizeIdx];

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const getCtx = (): CanvasRenderingContext2D | null =>
        canvasRef.current?.getContext('2d') ?? null;

    const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        // Account for CSS scaling: canvas logical size vs rendered size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    // ─── Canvas setup & resize ─────────────────────────────────────────────────
    const initCanvas = useCallback((preserveContent = false) => {
        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let snapshot: ImageData | null = null;
        if (preserveContent && canvas.width > 0) {
            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;

        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (snapshot) {
            ctx.putImageData(snapshot, 0, 0);
        } else if (initialDataUrl) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            img.src = initialDataUrl;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [initialDataUrl]);

    useEffect(() => {
        initCanvas(false);
        const observer = new ResizeObserver(() => initCanvas(true));
        if (wrapperRef.current) observer.observe(wrapperRef.current);
        return () => observer.disconnect();
    }, [initCanvas]);

    // ─── Drawing logic ─────────────────────────────────────────────────────────
    const saveHistory = useCallback(() => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
        history.current.push(snap);
        if (history.current.length > MAX_HISTORY) history.current.shift();
    }, []);

    const startDraw = useCallback((pos: { x: number; y: number }) => {
        saveHistory();
        isDrawing.current = true;
        lastPos.current = pos;
        const ctx = getCtx();
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }, [saveHistory]);

    const moveDraw = useCallback((pos: { x: number; y: number }) => {
        if (!isDrawing.current || !lastPos.current) return;
        const ctx = getCtx();
        if (!ctx) return;

        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
        ctx.lineWidth = currentSize;

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        lastPos.current = pos;
    }, [tool, color, currentSize]);

    const endDraw = useCallback(() => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        lastPos.current = null;
        const ctx = getCtx();
        if (ctx) ctx.globalCompositeOperation = 'source-over';
        // Emit change
        onChange?.(canvasRef.current?.toDataURL() ?? '');
    }, [onChange]);

    // ─── Mouse events ──────────────────────────────────────────────────────────
    const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current!;
        startDraw(getPos(e.nativeEvent, canvas));
    }, [startDraw]);

    const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing.current) return;
        e.preventDefault();
        const canvas = canvasRef.current!;
        moveDraw(getPos(e.nativeEvent, canvas));
    }, [moveDraw]);

    const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        endDraw();
    }, [endDraw]);

    // ─── Touch events (Android & iPhone) ──────────────────────────────────────
    const onTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault(); // Prevents scroll when drawing
        const canvas = canvasRef.current!;
        const touch = e.touches[0];
        startDraw(getPos(touch, canvas));
    }, [startDraw]);

    const onTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing.current) return;
        const canvas = canvasRef.current!;
        const touch = e.touches[0];
        moveDraw(getPos(touch, canvas));
    }, [moveDraw]);

    const onTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        endDraw();
    }, [endDraw]);

    // ─── Controls ──────────────────────────────────────────────────────────────
    const undo = useCallback(() => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas || history.current.length === 0) return;
        const prev = history.current.pop()!;
        ctx.putImageData(prev, 0, 0);
        onChange?.(canvas.toDataURL());
    }, [onChange]);

    const clearAll = useCallback(() => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        saveHistory();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        onChange?.(canvas.toDataURL());
    }, [saveHistory, onChange]);

    // ─── Cursor style ─────────────────────────────────────────────────────────
    const canvasCursor = tool === 'eraser'
        ? `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${ERASER_SIZE}' height='${ERASER_SIZE}'><circle cx='${ERASER_SIZE / 2}' cy='${ERASER_SIZE / 2}' r='${ERASER_SIZE / 2 - 1}' fill='none' stroke='%23999' stroke-width='1.5'/></svg>") ${ERASER_SIZE / 2} ${ERASER_SIZE / 2}, crosshair`
        : 'crosshair';

    return (
        <div className="flex flex-col rounded-3xl border-2 border-indigo-100 bg-indigo-50 overflow-hidden shadow-inner">
            {/* ── Toolbar ── */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-indigo-100 flex-wrap">
                {/* Label */}
                <div className="flex items-center gap-1.5 mr-1">
                    <Pencil className="w-4 h-4 text-indigo-500" />
                    <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hidden sm:block">
                        Coretan
                    </span>
                </div>

                {/* Tool: Pen / Eraser */}
                <div className="flex rounded-xl overflow-hidden border border-gray-100">
                    <button
                        title="Pena"
                        onClick={() => setTool('pen')}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1 ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Pen</span>
                    </button>
                    <button
                        title="Penghapus"
                        onClick={() => setTool('eraser')}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1 ${tool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <Eraser className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Hapus</span>
                    </button>
                </div>

                {/* Color palette (only when pen) */}
                {tool === 'pen' && (
                    <div className="flex items-center gap-1.5">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                title={c}
                                onClick={() => setColor(c)}
                                className={`w-6 h-6 rounded-full transition-transform border-2 ${color === c ? 'scale-125 border-gray-400' : 'border-transparent hover:scale-110'
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                )}

                {/* Pen size (only when pen) */}
                {tool === 'pen' && (
                    <div className="flex items-center gap-1 ml-1">
                        <button
                            onClick={() => setSizeIdx(i => Math.max(0, i - 1))}
                            disabled={sizeIdx === 0}
                            className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                        >
                            <Minus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <div
                            className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center"
                            style={{ width: PEN_SIZES[sizeIdx] * 1.8, height: PEN_SIZES[sizeIdx] * 1.8, backgroundColor: color }}
                        />
                        <button
                            onClick={() => setSizeIdx(i => Math.min(PEN_SIZES.length - 1, i + 1))}
                            disabled={sizeIdx === PEN_SIZES.length - 1}
                            className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                        >
                            <Plus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                    </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Undo + Clear */}
                <button
                    onClick={undo}
                    title="Undo"
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <Undo2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                    onClick={clearAll}
                    title="Hapus semua"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bersihkan</span>
                </button>
            </div>

            {/* ── Canvas ── */}
            <div
                ref={wrapperRef}
                className="relative w-full"
                style={{ height: 280, touchAction: 'none' }}
            >
                <canvas
                    ref={canvasRef}
                    style={{ cursor: canvasCursor, display: 'block', width: '100%', height: '100%' }}
                    // Mouse
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    // Touch (Android & iOS)
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onTouchCancel={onTouchEnd}
                />
                {/* Hint overlay saat canvas masih kosong */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ opacity: 0.25 }}
                >
                    <span className="text-indigo-400 text-sm font-bold select-none">
                        ✏️ Coret-coret di sini untuk perhitungan
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ScratchCanvas;
