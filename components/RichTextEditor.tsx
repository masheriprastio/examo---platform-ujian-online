import React, { useCallback, useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Configure katex for Quill
(window as any).katex = katex;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, height = '200px' }) => {
  const TABLE_PICKER_ROWS = 8;
  const TABLE_PICKER_COLS = 10;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
  const [tablePickerPos, setTablePickerPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [tableHover, setTableHover] = useState<{ rows: number; cols: number }>({ rows: 0, cols: 0 });
  const [isTableToolbarVisible, setIsTableToolbarVisible] = useState(false);
  const [tableToolbarPos, setTableToolbarPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const resolveCurrentTableElement = useCallback((): HTMLTableElement | null => {
    const quill = quillRef.current;
    if (!quill) return null;
    const tableModule = quill.getModule('table') as any;

    const range = quill.getSelection();
    if (range && tableModule && typeof tableModule.getTable === 'function') {
      const currentTable = tableModule.getTable(range);
      if (Array.isArray(currentTable) && currentTable[0]?.domNode instanceof HTMLTableElement) {
        return currentTable[0].domNode as HTMLTableElement;
      }
    }

    const nativeSelection = window.getSelection();
    const anchorNode = nativeSelection?.anchorNode || null;
    const anchorElement = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement || null;
    return anchorElement?.closest('table') || null;
  }, []);

  const updateTableToolbarState = useCallback(() => {
    const wrapper = wrapperRef.current;
    const tableElement = resolveCurrentTableElement();
    if (!wrapper || !tableElement) {
      setIsTableToolbarVisible(false);
      return;
    }

    const wrapperRect = wrapper.getBoundingClientRect();
    const tableRect = tableElement.getBoundingClientRect();
    setTableToolbarPos({
      top: tableRect.top - wrapperRect.top - 40,
      left: tableRect.left - wrapperRect.left
    });
    setIsTableToolbarVisible(true);
  }, [resolveCurrentTableElement]);

  const deleteCurrentTable = useCallback((): boolean => {
    const quill = quillRef.current;
    if (!quill) return false;
    const tableModule = quill.getModule('table') as any;
    if (!tableModule || typeof tableModule.deleteTable !== 'function') return false;

    const range = quill.getSelection(true);
    const currentFormats = range ? quill.getFormat(range) : {};
    const hasTableFormat = Boolean((currentFormats as any)?.table);

    const currentTable = (range && typeof tableModule.getTable === 'function')
      ? tableModule.getTable(range)
      : null;
    const isInsideTable = Array.isArray(currentTable) && currentTable[0];

    if (isInsideTable || hasTableFormat) {
      tableModule.deleteTable();
      return true;
    }

    const tableElement = resolveCurrentTableElement();
    if (!tableElement) return false;

    const tableBlot = Quill.find(tableElement, true) as any;
    if (tableBlot && typeof tableBlot.offset === 'function') {
      const tableIndex = tableBlot.offset(quill.scroll);
      quill.setSelection(tableIndex, 0, 'silent');
      tableModule.deleteTable();
      return true;
    }

    return false;
  }, [resolveCurrentTableElement]);

  // Update onChange ref when prop changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize Quill
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Tulis sesuatu...',
        modules: {
          table: true,
          toolbar: {
            container: [
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
              [{ 'script': 'sub' }, { 'script': 'super' }],
              [{ 'indent': '-1' }, { 'indent': '+1' }],
              [{ 'direction': 'rtl' }], // Arabic support
              [{ 'size': ['small', false, 'large', 'huge'] }],
              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'align': [] }],
              ['table', 'clean'],
              ['link', 'image', 'formula'] // Math formula support
            ],
            handlers: {
              table(this: any) {
                const tableModule = this.quill.getModule('table');
                if (tableModule && typeof tableModule.insertTable === 'function') {
                  const button = this.container?.querySelector('button.ql-table') as HTMLElement | null;
                  const wrapper = wrapperRef.current;
                  if (button && wrapper) {
                    const buttonRect = button.getBoundingClientRect();
                    const wrapperRect = wrapper.getBoundingClientRect();
                    setTablePickerPos({
                      top: buttonRect.bottom - wrapperRect.top + 8,
                      left: buttonRect.left - wrapperRect.left
                    });
                  }
                  setTableHover({ rows: 0, cols: 0 });
                  setIsTablePickerOpen(true);
                }
              }
            }
          }
        }
      });

      quillRef.current = quill;

      // Set initial content
      if (value) {
        isUpdatingRef.current = true;
        quill.root.innerHTML = value;
        isUpdatingRef.current = false;
      }

      // Handle content changes
      const handleChange = () => {
        if (!isUpdatingRef.current) {
          const html = quill.root.innerHTML;
          // Use the ref to always call the latest onChange function
          onChangeRef.current(html === '<p><br></p>' ? '' : html);
        }
        updateTableToolbarState();
      };

      quill.on('text-change', handleChange);
      quill.on('selection-change', () => {
        updateTableToolbarState();
      });
      updateTableToolbarState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTableToolbarState]);

  // Update Quill content when prop value changes externally
  useEffect(() => {
    if (quillRef.current && value !== undefined) {
      const currentContent = quillRef.current.root.innerHTML;
      if (currentContent !== value) {
        isUpdatingRef.current = true;
        quillRef.current.root.innerHTML = value || '';
        isUpdatingRef.current = false;
      }
    }
  }, [value]);

  useEffect(() => {
    if (!isTablePickerOpen) return;

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setIsTablePickerOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTablePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isTablePickerOpen]);

  useEffect(() => {
    updateTableToolbarState();
  }, [value, updateTableToolbarState]);

  const handleInsertTable = (rows: number, cols: number) => {
    const quill = quillRef.current;
    if (!quill) return;
    const tableModule = quill.getModule('table') as any;
    if (tableModule && typeof tableModule.insertTable === 'function') {
      quill.focus();
      tableModule.insertTable(rows, cols);
    }
    setIsTablePickerOpen(false);
  };

  const handleDeleteTableFromToolbar = () => {
    const confirmed = window.confirm('Hapus tabel ini?');
    if (!confirmed) return;
    const deleted = deleteCurrentTable();
    if (!deleted) {
      window.alert('Tabel tidak ditemukan. Klik salah satu sel tabel lalu coba lagi.');
    }
    setIsTableToolbarVisible(false);
  };

  return (
    <div ref={wrapperRef} className="bg-white relative">
      <div
        ref={editorRef}
        style={{ height }}
        className="bg-white [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse [&_td]:align-top [&_td]:h-11 [&_td]:px-2 [&_td]:py-1.5 [&_th]:align-top [&_th]:h-11 [&_th]:px-2 [&_th]:py-1.5"
      />
      {isTablePickerOpen && (
        <div
          className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[250px]"
          style={{ top: tablePickerPos.top, left: tablePickerPos.left }}
        >
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${TABLE_PICKER_COLS}, minmax(0, 1fr))` }}>
            {Array.from({ length: TABLE_PICKER_ROWS }).map((_, r) =>
              Array.from({ length: TABLE_PICKER_COLS }).map((__, c) => {
                const row = r + 1;
                const col = c + 1;
                const active = row <= tableHover.rows && col <= tableHover.cols;
                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    onMouseEnter={() => setTableHover({ rows: row, cols: col })}
                    onClick={() => handleInsertTable(row, col)}
                    className={`w-5 h-5 border border-gray-300 rounded-sm ${active ? 'bg-indigo-500 border-indigo-500' : 'bg-white hover:bg-indigo-100'}`}
                    aria-label={`Insert table ${row} x ${col}`}
                  />
                );
              })
            )}
          </div>
          <div className="text-xs text-gray-600 mt-2 text-center font-bold">
            {tableHover.rows > 0 && tableHover.cols > 0 ? `${tableHover.rows} x ${tableHover.cols}` : 'Pilih ukuran tabel'}
          </div>
        </div>
      )}
      {isTableToolbarVisible && (
        <div
          className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1 flex items-center gap-2"
          style={{ top: tableToolbarPos.top, left: tableToolbarPos.left }}
        >
          <button
            type="button"
            onClick={handleDeleteTableFromToolbar}
            className="px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded"
          >
            Hapus Tabel
          </button>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
