import { cx } from './cx.js';

export function Cursor({ shape = 'block', blink = true, className, style }) {
  return (
    <span
      aria-hidden="true"
      className={cx('cv-cursor', 'cv-cursor--' + shape, blink && 'cv-cursor--blink', className)}
      style={style}
    />
  );
}

export function Prompt({ path = '~', symbol = '$', user, className, children, ...rest }) {
  return (
    <div className={cx('cv-prompt', className)} {...rest}>
      <span className="cv-prompt__path">
        {user && <span className="cv-prompt__user">{user}:</span>}
        {path}
      </span>
      <span className="cv-prompt__sym">{symbol}</span>
      {children != null && <span className="cv-prompt__cmd">{children}</span>}
    </div>
  );
}
