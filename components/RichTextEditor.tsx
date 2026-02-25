import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Masukkan teks...",
  height = "200px"
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    // Initialize Quill
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: placeholder,
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'align': [] }],
          ['link', 'image'],
          ['clean']
        ]
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
        onChange(html === '<p><br></p>' ? '' : html);
      }
    };

    quill.on('text-change', handleChange);

    return () => {
      quill.off('text-change', handleChange);
    };
  }, []);

  // Update Quill content when prop value changes externally
  useEffect(() => {
    if (quillRef.current && value !== undefined) {
      isUpdatingRef.current = true;
      quillRef.current.root.innerHTML = value || '';
      isUpdatingRef.current = false;
    }
  }, [value]);

  return (
    <div className="quill-wrapper">
      <style>{`
        .quill-wrapper {
          border-radius: 0.75rem;
          border: 2px solid #e5e7eb;
          overflow: hidden;
          background: white;
        }

        .quill-wrapper .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 0.5rem;
        }

        .quill-wrapper .ql-container {
          border: none;
          font-family: inherit;
          font-size: 0.875rem;
        }

        .quill-wrapper .ql-editor {
          min-height: ${height};
          padding: 1rem;
          font-weight: 500;
          color: #111827;
        }

        .quill-wrapper .ql-editor.ql-blank::before {
          color: #d1d5db;
          font-style: normal;
        }

        .quill-wrapper .ql-toolbar button:hover,
        .quill-wrapper .ql-toolbar.ql-snow .ql-picker-label:hover,
        .quill-wrapper .ql-toolbar.ql-snow button:hover,
        .quill-wrapper .ql-toolbar.ql-snow button:focus,
        .quill-wrapper .ql-toolbar.ql-snow button.ql-active,
        .quill-wrapper .ql-toolbar.ql-snow .ql-picker-label.ql-active,
        .quill-wrapper .ql-toolbar.ql-snow .ql-picker-item:hover,
        .quill-wrapper .ql-toolbar.ql-snow .ql-picker-item.ql-selected {
          color: #4f46e5;
        }

        .quill-wrapper .ql-snow.ql-toolbar button:hover::before,
        .quill-wrapper .ql-snow.ql-toolbar button:focus::before,
        .quill-wrapper .ql-snow.ql-toolbar button.ql-active::before {
          color: #4f46e5;
        }
      `}</style>
      <div ref={editorRef} />
    </div>
  );
};

export default RichTextEditor;
