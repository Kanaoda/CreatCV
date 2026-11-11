import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { listTemplateOptions } from './templates/index.js';

/**
 * Template chooser with color swatches + full names (native <select> truncates).
 */
export function TemplatePicker({ value, onChange }) {
  const options = useMemo(() => listTemplateOptions(), []);
  const selected = options.find((p) => p.id === value) || options[0];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const listId = useId();
  const labelId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((p) =>
      p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="template-picker" ref={rootRef}>
      <span id={labelId} className="template-picker__label">Template</span>
      <button
        type="button"
        className="template-picker__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        title={selected?.name || 'Template'}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="template-swatch"
          aria-hidden="true"
          style={{
            '--swatch-primary': selected?.primary,
            '--swatch-accent': selected?.accent,
            '--swatch-paper': selected?.paper,
          }}
        />
        <span className="template-picker__name">{selected?.name || 'Template'}</span>
        <span className="template-picker__chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="template-picker__panel" role="presentation">
          <input
            type="search"
            className="template-picker__search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            aria-label="Search templates"
            autoFocus
          />
          <ul
            id={listId}
            className="template-picker__list"
            role="listbox"
            aria-labelledby={labelId}
          >
            {filtered.map((p) => {
              const isActive = p.id === value;
              return (
                <li key={p.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`template-picker__option${isActive ? ' is-active' : ''}`}
                    title={p.name}
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <span
                      className="template-swatch"
                      aria-hidden="true"
                      style={{
                        '--swatch-primary': p.primary,
                        '--swatch-accent': p.accent,
                        '--swatch-paper': p.paper,
                      }}
                    />
                    <span className="template-picker__option-text">
                      <span className="template-picker__option-name">{p.name}</span>
                      {p.layoutFamily ? (
                        <span className="template-picker__option-meta">{p.layoutFamily}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="template-picker__empty" role="presentation">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
