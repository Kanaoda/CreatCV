import React from 'react';

/**
 * A robust WYSIWYG text component wrapping contentEditable.
 * Prevents HTML pollution (prevents Enter/Format pasting), and uses onBlur for stable React sync.
 */
export function EditableText({
  value,
  onChange,
  placeholder,
  className,
  style,
  tagName: Tag = 'span',
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Stop newlines
      e.target.blur();    // Exit focus
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text); // Insert plain text only
  };

  const handleBlur = (e) => {
    const text = e.target.innerText.trim();
    onChange(text);
  };

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onBlur={handleBlur}
      className={`cv-editable-text ${className || ''}`}
      style={{ outline: 'none', ...style }}
      data-placeholder={placeholder}
    >
      {value}
    </Tag>
  );
}
