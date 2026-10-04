import { cx } from './cx.js';

export function Icon({ name, size = 18, fill = false, weight = 400, title, className, style, ...rest }) {
  const opsz = Math.min(48, Math.max(20, size));
  return (
    <span
      className={cx('cv-icon', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{
        fontSize: size,
        fontVariationSettings: "'FILL' " + (fill ? 1 : 0) + ", 'wght' " + weight + ", 'GRAD' 0, 'opsz' " + opsz,
        ...style,
      }}
      {...rest}
    >
      {name}
    </span>
  );
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  kbd,
  disabled,
  type = 'button',
  href,
  className,
  children,
  ...rest
}) {
  const s = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const El = href ? 'a' : 'button';
  return (
    <El
      type={href ? undefined : type}
      href={href}
      className={cx('cv-btn', 'cv-btn--' + variant, 'cv-btn--' + size, className)}
      disabled={href ? undefined : disabled}
      {...rest}
    >
      {icon && <Icon name={icon} size={s} />}
      {children != null && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={s} />}
      {kbd && <span className="cv-btn__kbd">{kbd}</span>}
    </El>
  );
}

export function IconButton({ icon, label, size = 'md', variant = 'ghost', active = false, fill, className, ...rest }) {
  const s = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={cx(
        'cv-btn',
        'cv-btn--' + variant,
        'cv-btn--' + size,
        'cv-iconbtn',
        active && 'cv-iconbtn--active',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={s} fill={fill ?? active} />
    </button>
  );
}

export function Kbd({ keys, children, className, ...rest }) {
  if (keys && keys.length) {
    return (
      <span className={cx('cv-kbd-group', className)} {...rest}>
        {keys.map((k, i) => (
          <kbd key={i} className="cv-kbd">
            {k}
          </kbd>
        ))}
      </span>
    );
  }
  return (
    <kbd className={cx('cv-kbd', className)} {...rest}>
      {children}
    </kbd>
  );
}

export function Tag({ tone = 'neutral', variant = 'outline', icon, className, style, children, ...rest }) {
  const t = tone === 'neutral' ? 'var(--text-muted)' : 'var(--' + tone + ')';
  return (
    <span className={cx('cv-tag', 'cv-tag--' + variant, className)} style={{ '--tone': t, ...style }} {...rest}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}
