import { Tag } from './core.jsx';
import { cx } from './cx.js';
import { Segmented } from './forms.jsx';

export function KeyValue({ items = [], leader = 'dots', className, ...rest }) {
  return (
    <dl className={cx('cv-kv', leader === 'none' && 'cv-kv--plain', className)} {...rest}>
      {items.map((it, i) => {
        const k = Array.isArray(it) ? it[0] : it.k;
        const v = Array.isArray(it) ? it[1] : it.v;
        return (
          <div className="cv-kv__row" key={i}>
            <dt className="cv-kv__k">{k}</dt>
            <span className="cv-kv__lead" aria-hidden="true" />
            <dd className="cv-kv__v">{v}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function SectionHeader({ index, title, command, as: H = 'h2', className, children, ...rest }) {
  return (
    <header className={cx('cv-section', className)} {...rest}>
      {index && <span className="cv-section__idx">{index}</span>}
      <H className="cv-section__title">{title}</H>
      {command && <span className="cv-section__cmd">$ {command}</span>}
      {children && <div className="cv-section__aside">{children}</div>}
    </header>
  );
}

export function TimelineEntry({
  period,
  duration,
  role,
  org,
  orgHref,
  location,
  tags = [],
  className,
  children,
  ...rest
}) {
  return (
    <article className={cx('cv-tl-entry', className)} {...rest}>
      <div className="cv-tl-entry__when">
        <span>{period}</span>
        {duration && <span style={{ color: 'var(--text-disabled)' }}>{duration}</span>}
      </div>
      <div className="cv-tl-entry__main">
        <div className="cv-tl-entry__role">{role}</div>
        {(org || location) && (
          <div className="cv-tl-entry__org">
            {orgHref ? <a href={orgHref}>{org}</a> : org}
            {org && location ? ' · ' : ''}
            {location}
          </div>
        )}
        {children && <div className="cv-tl-entry__body">{children}</div>}
        {tags.length > 0 && (
          <div className="cv-tl-entry__tags">
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

const LANG_OPTIONS = [
  { value: 'en', label: 'en', title: 'English' },
  { value: 'ua', label: 'ua', title: 'Українська' },
];

/** en / ua switch. The page sets <html lang> itself. */
export function LangSwitch({ value, onChange, size = 'md', ...rest }) {
  return (
    <Segmented aria-label="Language" options={LANG_OPTIONS} value={value} size={size} onChange={onChange} {...rest} />
  );
}

const DEFAULT_LABELS = { night: 'night', dark: 'dark', light: 'light' };

/** night / dark / light switch. The page sets <html data-theme> itself. */
export function ThemeSwitch({ value, onChange, iconOnly = false, size = 'md', labels = DEFAULT_LABELS, ...rest }) {
  const opts = [
    { value: 'night', label: labels.night, icon: 'bedtime' },
    { value: 'dark', label: labels.dark, icon: 'dark_mode' },
    { value: 'light', label: labels.light, icon: 'light_mode' },
  ];
  return (
    <Segmented
      aria-label="Theme"
      options={opts}
      value={value}
      size={size}
      iconOnly={iconOnly}
      onChange={onChange}
      {...rest}
    />
  );
}
