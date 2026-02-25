import React, { useEffect, useRef } from 'react';
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
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);
  const onChangeRef = useRef(onChange);

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
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }], // Arabic support
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['clean'],
            ['link', 'image', 'formula'] // Math formula support
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
          // Use the ref to always call the latest onChange function
          onChangeRef.current(html === '<p><br></p>' ? '' : html);
        }
      };

      quill.on('text-change', handleChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="bg-white">
      <div ref={editorRef} style={{ height }} className="bg-white" />
    </div>
  );
};

export default RichTextEditor;
