/**
 * Professional Instruction Editor
 * Monaco Editor-inspired with PLC syntax support
 * Features: Syntax highlighting, keyword suggestions, templates, keyboard shortcuts
 */

"use client";

import React, { useRef, useState, useEffect } from 'react';
import { usePlcStore } from '@/store/plcStore';
import { useGenerateLogic } from '@/hooks/useGenerateLogic';
import { INDUSTRIAL_COLORS, INDUSTRIAL_TYPOGRAPHY } from '@/constants/industrialDesign';

const MAX_CHARS = 500;

const PLC_KEYWORDS = ['X', 'Y', 'M', 'D', 'T', 'C', 'LD', 'AND', 'ANI', 'OR', 'ORI', 'OUT', 'END'];

const TEMPLATES = [
  {
    id: 'motor',
    label: 'Motor Start/Stop',
    value: 'Start motor on X0. Stop on X1. Emergency stop X2. Output to Y0.',
  },
  {
    id: 'interlock',
    label: 'Safety Interlock',
    value: 'Start signal X0. Safety interlock X1 (normally closed). Fault reset X2. Output relay Y0.',
  },
  {
    id: 'conveyor',
    label: 'Conveyor Belt',
    value: 'Conveyor start X0. Emergency stop X1. Motor output Y0. Running indicator lamp Y1.',
  },
  {
    id: 'timer',
    label: 'Timer Delay',
    value: 'Start trigger X0. After 5-second delay, activate output coil Y0. Stop on X1.',
  },
];

interface InstructionEditorProps {
  onGenerate?: (text: string) => void;
}

export default function InstructionEditor({ onGenerate }: InstructionEditorProps) {
  const { inputText, setInputText, isLoading } = usePlcStore();
  const { mutate: generateLogic } = useGenerateLogic();
  const [charCount, setCharCount] = useState(inputText.length);
  const [showTemplates, setShowTemplates] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Update character count
  useEffect(() => {
    setCharCount(inputText.length);
  }, [inputText]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    if (value.length <= MAX_CHARS) {
      setInputText(value);
      updateSuggestions(value, e.currentTarget.selectionStart);
    }
  };

  // Update suggestions based on cursor position
  const updateSuggestions = (text: string, position: number) => {
    const lineStart = text.lastIndexOf('\n', position) + 1;
    const currentLine = text.substring(lineStart, position);
    const lastWord = currentLine.split(/[\s,.]/).pop() || '';

    if (lastWord.length > 0) {
      const relevant = PLC_KEYWORDS.filter(kw =>
        kw.toLowerCase().startsWith(lastWord.toLowerCase())
      );
      setSuggestions(relevant.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }

    // Tab to insert suggestion
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      insertSuggestion(suggestions[0]);
    }
  };

  // Insert suggestion at cursor
  const insertSuggestion = (word: string) => {
    if (!editorRef.current) return;
    const ta = editorRef.current;
    const before = inputText.substring(0, ta.selectionStart);
    const after = inputText.substring(ta.selectionStart);
    const lastWord = before.split(/[\s,.]/).pop() || '';
    
    const newText = before.substring(0, before.length - lastWord.length) + word + ' ' + after;
    setInputText(newText);
    setSuggestions([]);

    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = before.length - lastWord.length + word.length + 1;
    });
  };

  // Insert template
  const insertTemplate = (template: typeof TEMPLATES[0]) => {
    setInputText(template.value);
    setShowTemplates(false);
    editorRef.current?.focus();
  };

  // Handle generate
  const handleGenerate = () => {
    if (inputText.trim()) {
      generateLogic(inputText);
      onGenerate?.(inputText);
    }
  };

  // Handle clear
  const handleClear = () => {
    setInputText('');
    setSuggestions([]);
    editorRef.current?.focus();
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: INDUSTRIAL_COLORS.bg.panel,
        overflow: 'hidden',
      }}
    >
      {/* ─────────────────────────────────────────────────────── */}
      {/* HEADER                                                 */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: '48px',
          flexShrink: 0,
          borderBottom: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: INDUSTRIAL_COLORS.text.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          📝 Instruction Input
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              fontSize: '10px',
              color: INDUSTRIAL_COLORS.text.muted,
              fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
            }}
          >
            {charCount}/{MAX_CHARS}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* EDITOR AREA                                            */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Textarea */}
        <textarea
          ref={editorRef}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={() => {
            // Show templates on focus if empty
            if (!inputText.trim()) {
              setShowTemplates(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowTemplates(false), 200);
          }}
          placeholder="Describe your PLC logic in natural language...&#10;e.g., 'Start motor on X0, stop on X1, emergency stop X2 to Y0'&#10;&#10;Tip: Use Ctrl+Enter to generate"
          style={{
            flex: 1,
            width: '100%',
            padding: '12px',
            border: 'none',
            outline: 'none',
            backgroundColor: INDUSTRIAL_COLORS.bg.editor,
            color: INDUSTRIAL_COLORS.text.primary,
            fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
            fontSize: '12px',
            lineHeight: '1.6',
            resize: 'none',
            fontWeight: 400,
          } as React.CSSProperties}
        />

        {/* Autocomplete Suggestions */}
        {suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              backgroundColor: INDUSTRIAL_COLORS.bg.elevated,
              border: `1px solid ${INDUSTRIAL_COLORS.accent.primary}`,
              borderRadius: '4px',
              overflow: 'hidden',
              zIndex: 10,
              boxShadow: `0 4px 12px ${INDUSTRIAL_COLORS.ui.shadow}`,
            }}
          >
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                onClick={() => insertSuggestion(suggestion)}
                style={{
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
                  color: i === 0 ? INDUSTRIAL_COLORS.accent.primary : INDUSTRIAL_COLORS.text.secondary,
                  backgroundColor: i === 0 ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? `1px solid ${INDUSTRIAL_COLORS.ui.border}` : 'none',
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        {/* Template Quick Links */}
        {showTemplates && !inputText.trim() && (
          <div
            style={{
              position: 'absolute',
              inset: '48px',
              backgroundColor: INDUSTRIAL_COLORS.bg.editor,
              padding: '12px',
              overflow: 'auto',
              zIndex: 5,
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: INDUSTRIAL_COLORS.text.secondary,
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Quick Templates
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => insertTemplate(template)}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: INDUSTRIAL_COLORS.bg.elevated,
                    border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
                    borderRadius: '4px',
                    color: INDUSTRIAL_COLORS.text.primary,
                    fontSize: '11px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 150ms ease-out',
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{template.label}</div>
                  <div
                    style={{
                      fontSize: '9px',
                      color: INDUSTRIAL_COLORS.text.muted,
                      marginTop: '2px',
                    }}
                  >
                    {template.value.substring(0, 40)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* ACTION BUTTONS                                         */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: '52px',
          flexShrink: 0,
          borderTop: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
          padding: '8px',
          display: 'flex',
          gap: '6px',
        }}
      >
        <button
          onClick={handleGenerate}
          disabled={!inputText.trim() || isLoading}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: !inputText.trim() || isLoading 
              ? INDUSTRIAL_COLORS.ui.border 
              : INDUSTRIAL_COLORS.accent.primary,
            color: INDUSTRIAL_COLORS.bg.base,
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease-out',
            opacity: !inputText.trim() || isLoading ? 0.5 : 1,
          }}
        >
          {isLoading ? '⏳ Generating...' : '▶ Generate'}
        </button>

        <button
          onClick={handleClear}
          disabled={!inputText || isLoading}
          style={{
            padding: '8px 12px',
            backgroundColor: 'transparent',
            color: INDUSTRIAL_COLORS.text.secondary,
            border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 150ms ease-out',
            opacity: !inputText || isLoading ? 0.5 : 1,
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* HELP TEXT                                              */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          fontSize: '9px',
          color: INDUSTRIAL_COLORS.text.muted,
          padding: '6px 12px',
          backgroundColor: INDUSTRIAL_COLORS.bg.base,
          borderTop: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
        }}
      >
        💡 <strong>Keyboard shortcuts:</strong> Ctrl+Enter generate • Tab autocomplete
      </div>
    </div>
  );
}
