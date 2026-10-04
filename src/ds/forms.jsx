import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './core.jsx';
import { cx } from './cx.js';
import { useIsoLayoutEffect } from './hooks.js';

/** Measures the element of the current option and returns its { left, width }, plus whether to animate. */
export function useIndicator(cur, count) {
  const wrap = useRef(null);
  const refs = useRef({});
  const [pos, setPos] = useState(null);
  const [ready, setReady] = useState(false);
  const measure = useCallback(() => {
    const el = refs.current[cur];
    if (el) setPos({ left: el.offsetLeft, width: el.offsetWidth });
  }, [cur]);
  useIsoLayoutEffect(measure, [measure, count]);
  useEffect(() => {
    if (!wrap.current || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [measure]);
  useEffect(() => {
    if (pos && !ready) requestAnimationFrame(() => setReady(true));
  }, [pos, ready]);
  return { wrap, refs, pos, ready };
}

export function Segmented({
  options = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  iconOnly = false,
  className,
  ...rest
}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const [inner, setInner] = useState(defaultValue ?? (opts[0] && opts[0].value));
  const cur = value ?? inner;
  const { wrap, refs, pos, ready } = useIndicator(cur, opts.length);
  const pick = (v) => {
    setInner(v);
    if (onChange) onChange(v);
  };
  return (
    <div
      ref={wrap}
      role="group"
      className={cx('cv-seg', 'cv-seg--' + size, iconOnly && 'cv-seg--icon', className)}
      {...rest}
    >
      <span
        className={cx('cv-seg__thumb', ready && 'cv-seg__thumb--ready')}
        style={pos ? { left: pos.left, width: pos.width } : { opacity: 0 }}
      />
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          ref={(el) => {
            refs.current[o.value] = el;
          }}
          className="cv-seg__opt"
          aria-pressed={cur === o.value}
          aria-label={iconOnly ? o.title || o.label : undefined}
          title={iconOnly ? o.title || o.label : o.title}
          onClick={() => pick(o.value)}
        >
          {o.icon && <Icon name={o.icon} size={size === 'sm' ? 14 : 16} fill={cur === o.value} />}
          {!iconOnly && <span>{o.label}</span>}
        </button>
      ))}
    </div>
  );
}
