import { SECTION_IDS } from '../content.js';
import { IconButton, Kbd, LangSwitch, Tabs, ThemeSwitch, Tooltip } from '../ds/index.js';

export function Header({
  t,
  active,
  theme,
  lang,
  termVisible,
  palOpen,
  onLogo,
  onTab,
  onTheme,
  onLang,
  onTerm,
  onPal,
}) {
  return (
    <header className="cv-head glass" data-noprint="">
      <div className="cv-head__in">
        <a href="#cv-about" onClick={onLogo} className="cv-logo glow">
          <span>~/</span>volempdoge
        </a>
        <Tabs
          className="cv-head__tabs"
          tabs={SECTION_IDS.map((id) => ({ id, label: t.nav[id] }))}
          value={active}
          onChange={onTab}
        />
        <div className="cv-head__tools">
          <div className="cv-head__switches">
            <ThemeSwitch value={theme} onChange={onTheme} iconOnly size="sm" />
            <LangSwitch value={lang} onChange={onLang} size="sm" />
          </div>
          <div className="cv-head__buttons">
            <Tooltip content={t.termLabel + ' `'} side="bottom">
              <IconButton icon="terminal" label="terminal" size="sm" active={termVisible} onClick={onTerm} />
            </Tooltip>
            <Tooltip content={t.commands + ' ⌘K'} side="bottom">
              <IconButton icon="search" label={t.commands} size="sm" active={palOpen} onClick={onPal} />
            </Tooltip>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer({ t, commit }) {
  return (
    <footer className="cv-foot" data-noprint="">
      <div className="cv-foot__in">
        <span className="cv-foot__name">{t.name}</span>
        {commit && (
          <a href={commit.url} target="_blank" rel="noreferrer" className="cv-foot__commit">
            <span>{commit.sha.slice(0, 7)}</span>
            <span>{commit.date}</span>
          </a>
        )}
        <a href="/llms.txt">llms.txt</a>
        <a href="/index.md">index.md</a>
        <div className="cv-foot__keys">
          <span>
            <Kbd keys={['⌘', 'K']} />
            <span>{t.commands}</span>
          </span>
          <span>
            <Kbd>`</Kbd>
            <span>terminal</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
