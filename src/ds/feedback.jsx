import { useEffect, useRef, useState } from 'react';
import { Icon, IconButton } from './core.jsx';
import { cx } from './cx.js';

const ICONS = { info: 'info', success: 'check_circle', warning: 'warning', danger: 'error', accent: 'terminal' };

export function Toast({ tone = 'info', title, icon, action, onClose, className, style, children, ...rest }) {
  return (
    <div
      role="status"
      className={cx('cv-toast', className)}
      style={{ '--tone': 'var(--' + tone + ')', ...style }}
      {...rest}
    >
      <Icon name={icon || ICONS[tone] || 'info'} size={18} className="cv-toast__icon" />
      <div className="cv-toast__main">
        {title && <div className="cv-toast__title">{title}</div>}
        {children && <div className="cv-toast__msg">{children}</div>}
        {action && <div className="cv-toast__action">{action}</div>}
      </div>
      {onClose && <IconButton icon="close" label="Dismiss" size="sm" onClick={onClose} />}
    </div>
  );
}

export function Tooltip({ content, side = 'top', delay = 250, children, className, ...rest }) {
  const [open, setOpen] = useState(false);
  const t = useRef();
  const show = () => {
    clearTimeout(t.current);
    t.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(t.current);
    setOpen(false);
  };
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <span
      className={cx('cv-tipwrap', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      {...rest}
    >
      {children}
      {open && content && (
        <span role="tooltip" className={'cv-tip cv-tip--' + side}>
          {content}
        </span>
      )}
    </span>
  );
}
