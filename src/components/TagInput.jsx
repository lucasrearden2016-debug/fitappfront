import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Input de etiquetas estilo LinkedIn: escribís, Enter (o coma) y queda como chip.
export default function TagInput({ value = [], onChange, placeholder, suggestions = [], variant = 'neutral', max = 60 }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const add = (raw) => {
    const items = raw
      .split(',')
      .map((s) => s.trim().slice(0, 60))
      .filter(Boolean);
    const next = [...value];
    for (const item of items) {
      if (next.length >= max) break;
      if (!next.some((v) => v.toLowerCase() === item.toLowerCase())) next.push(item);
    }
    if (next.length !== value.length) onChange(next);
    setText('');
  };

  const remove = (i) => onChange(value.filter((_, j) => j !== i));

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // que Enter no envíe el formulario
      if (text.trim()) add(text);
    } else if (e.key === 'Backspace' && !text && value.length) {
      remove(value.length - 1);
    }
  };

  const pending = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

  return (
    <div>
      <div className={`tag-box tag-${variant}`} onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
        {value.map((tag, i) => (
          <span className="tag-chip" key={tag}>
            {tag}
            <button type="button" aria-label={`${t('Quitar')} ${tag}`} onClick={() => remove(i)}>×</button>
          </span>
        ))}
        <input
          value={text}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => (e.target.value.includes(',') ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={onKeyDown}
          onBlur={() => text.trim() && add(text)}
        />
      </div>
      {pending.length > 0 && (
        <div className="tag-suggestions">
          {pending.slice(0, 8).map((s) => (
            <button type="button" key={s} onClick={() => add(s)}>+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
