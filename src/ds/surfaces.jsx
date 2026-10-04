import { Icon } from './core.jsx';
import { cx } from './cx.js';

export function Card({ title, meta, icon, href, onClick, footer, className, children, ...rest }) {
  const interactive = !!(href || onClick);
  const El = href ? 'a' : onClick ? 'button' : 'div';
  const external = href && /^https?:/.test(href);
  return (
    <El
      href={href}
      onClick={onClick}
      type={El === 'button' ? 'button' : undefined}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={cx('cv-card', interactive && 'cv-card--interactive', className)}
      {...rest}
    >
      {(title || meta || icon) && (
        <div className="cv-card__head">
          {icon && <Icon name={icon} size={18} className="cv-card__icon" />}
          <div className="cv-card__title">{title}</div>
          {meta && <div className="cv-card__meta">{meta}</div>}
          {interactive && (
            <Icon name={external ? 'arrow_outward' : 'arrow_forward'} size={16} className="cv-card__arrow" />
          )}
        </div>
      )}
      {children && <div className="cv-card__body">{children}</div>}
      {footer && <div className="cv-card__foot">{footer}</div>}
    </El>
  );
}

export function Window({
  title,
  toolbar,
  footer,
  solid = false,
  lights = true,
  onClose,
  onMinimize,
  onMaximize,
  bodyStyle,
  className,
  style,
  children,
  ...rest
}) {
  return (
    <section className={cx('cv-window', solid && 'cv-window--solid', className)} style={style} {...rest}>
      <header className="cv-window__bar">
        <div className="cv-window__lights">
          {lights && (
            <>
              <button
                type="button"
                className="cv-tl"
                style={{ background: 'var(--tl-close)' }}
                aria-label="Close"
                onClick={onClose}
              >
                <Icon name="close" size={10} weight={700} />
              </button>
              <button
                type="button"
                className="cv-tl"
                style={{ background: 'var(--tl-min)' }}
                aria-label="Minimize"
                onClick={onMinimize}
              >
                <Icon name="remove" size={10} weight={700} />
              </button>
              <button
                type="button"
                className="cv-tl"
                style={{ background: 'var(--tl-max)' }}
                aria-label="Maximize"
                onClick={onMaximize}
              >
                <Icon name="open_in_full" size={9} weight={700} />
              </button>
            </>
          )}
        </div>
        <div className="cv-window__title">{title}</div>
        <div className="cv-window__tools">{toolbar}</div>
      </header>
      <div className="cv-window__body" style={bodyStyle}>
        {children}
      </div>
      {footer && <footer className="cv-window__foot">{footer}</footer>}
    </section>
  );
}
