import { useState } from 'react';
import { Icon } from './core.jsx';
import { cx } from './cx.js';
import { useIndicator } from './forms.jsx';

export function Tabs({ tabs = [], value, defaultValue, onChange, className, ...rest }) {
  const [inner, setInner] = useState(defaultValue ?? (tabs[0] && tabs[0].id));
  const cur = value ?? inner;
  const { wrap, refs, pos: ink, ready } = useIndicator(cur, tabs.length);
  const pick = (id) => {
    setInner(id);
    if (onChange) onChange(id);
  };
  const onKey = (e) => {
    const i = tabs.findIndex((t) => t.id === cur);
    if (e.key === 'ArrowRight') pick(tabs[(i + 1) % tabs.length].id);
    if (e.key === 'ArrowLeft') pick(tabs[(i - 1 + tabs.length) % tabs.length].id);
  };
  return (
    <div ref={wrap} role="tablist" className={cx('cv-tabs', className)} onKeyDown={onKey} {...rest}>
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          role="tab"
          type="button"
          className="cv-tab"
          aria-selected={cur === t.id}
          tabIndex={cur === t.id ? 0 : -1}
          onClick={() => pick(t.id)}
        >
          {t.icon && <Icon name={t.icon} size={16} />}
          <span>{t.label}</span>
          {t.count != null && <span className="cv-tab__count">{t.count}</span>}
        </button>
      ))}
      <span
        className={cx('cv-tabs__ink', ready && 'cv-tabs__ink--ready')}
        style={ink ? { left: ink.left, width: ink.width } : { opacity: 0 }}
      />
    </div>
  );
}
