import { EMAIL, GITHUB_URL, LINKEDIN_URL, STACK } from '../content.js';
import {
  Button,
  Card,
  Cursor,
  Icon,
  IconButton,
  KeyValue,
  Prompt,
  SectionHeader,
  Tag,
  TimelineEntry,
  Tooltip,
} from '../ds/index.js';
import { GithubIcon, LinkedinIcon } from './brands.jsx';

export function About({ t, role, roleMenu, onPrint }) {
  return (
    <section id="cv-about" className="cv-sec">
      <div className="cv-about">
        <div className="cv-about__bar">
          <Prompt path="~/cv">whoami --focus {role}</Prompt>
          <div className="cv-about__pdf" data-noprint="">
            <Tooltip content={t.pdfCta} side="bottom">
              <Button variant="ghost" size="sm" icon="download" onClick={onPrint} aria-label={t.pdfCta}>
                pdf
              </Button>
            </Tooltip>
          </div>
        </div>
        <h1 className="cv-name glow">
          <span>{t.name}</span>
          <Cursor />
        </h1>
        <RoleMenu t={t} role={role} {...roleMenu} />
        <div className="cv-print-contact" data-print-only="">
          {t.printLoc} · <a href={'mailto:' + EMAIL}>{EMAIL}</a> · <a href={GITHUB_URL}>github.com/volempdoge</a> ·{' '}
          <a href={LINKEDIN_URL}>linkedin.com/in/volempdoge</a>
        </div>
        <p className="cv-summary">{t.summary[role]}</p>
        <div className="cv-about__cta" data-noprint="">
          <Button variant="primary" icon="mail" href={'mailto:' + EMAIL}>
            {t.contactCta}
          </Button>
          <Button iconRight="arrow_outward" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <span className="cv-brand">
              <GithubIcon size={15} />
              <span>github</span>
            </span>
          </Button>
          <Button iconRight="arrow_outward" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
            <span className="cv-brand">
              <LinkedinIcon size={15} />
              <span>linkedin</span>
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}

function RoleMenu({ t, role, open, menuRef, onToggle, onPick }) {
  return (
    <div ref={menuRef} className="cv-role">
      <button
        type="button"
        className="cv-role__btn"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t.roleCaption}
      >
        <span>{t.titles[role]}</span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={18} />
      </button>
      {open && (
        <div className="cv-window cv-role__menu" role="listbox" aria-label={t.roleCaption}>
          <div className="cv-role__caption">$ {t.roleCaption}</div>
          {['embedded', 'software'].map((r) => (
            <button
              key={r}
              type="button"
              role="option"
              aria-selected={role === r}
              className={'cv-palette__item' + (role === r ? ' cv-palette__item--active' : '')}
              onClick={() => onPick(r)}
            >
              <Icon name={r === 'embedded' ? 'memory' : 'code'} size={18} />
              <span className="cv-palette__label">{t.titles[r]}</span>
              <span className="cv-palette__hint">{role === r ? '●' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Experience({ t, points, duration }) {
  const job = t.job;
  return (
    <section id="cv-experience" className="cv-sec cv-sec--tight">
      <SectionHeader title={t.nav.experience} command="cat work.log" />
      <TimelineEntry
        period={
          <span className="cv-when">
            <span>{job.period}</span>
            <span>{duration}</span>
          </span>
        }
        role={job.role}
        org={job.org}
        location={job.location}
        tags={STACK}
      >
        <ul className="cv-points">
          {points.map((pt) => (
            <li key={pt.h}>
              <span data-bullet="">→</span>
              <span>
                <strong>{pt.h}</strong> {pt.t}
              </span>
            </li>
          ))}
        </ul>
      </TimelineEntry>
    </section>
  );
}

export function Projects({ t, projects }) {
  return (
    <section id="cv-projects" className="cv-sec">
      <SectionHeader title={t.nav.projects} command="ls ./projects" />
      <div className="cv-stack">
        {projects.map((p) => (
          <Card key={p.file} title={p.title} meta={p.meta} icon="folder_open" href={p.href}>
            {p.body}
          </Card>
        ))}
      </div>
    </section>
  );
}

export function Skills({ t, skills }) {
  return (
    <section id="cv-skills" className="cv-sec">
      <SectionHeader title={t.nav.skills} command="cat skills.txt" />
      <div className="cv-grid2">
        {skills.map((row) => (
          <div key={row.key} className="cv-group">
            <span className="cv-group__label">{row.label}</span>
            <div className="cv-tags" data-tags="">
              {row.items.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Education({ t, edu }) {
  return (
    <section id="cv-education" className="cv-sec cv-sec--tight">
      <SectionHeader title={t.nav.education} command="cat edu.log" />
      <div className="cv-edu">
        {edu.map((e) => (
          <TimelineEntry
            key={e.role}
            period={e.period}
            duration={e.duration}
            role={e.role}
            org={e.org}
            tags={e.courses}
          />
        ))}
      </div>
      <div className="cv-grid2 cv-edu__more">
        <div className="cv-group">
          <span className="cv-group__label">{t.spokenTitle}</span>
          <KeyValue items={t.spoken} />
        </div>
        <div className="cv-group">
          <span className="cv-group__label">{t.interestsTitle}</span>
          <div className="cv-tags" data-tags="">
            {t.interests.map((it) => (
              <Tag key={it}>{it}</Tag>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Contact({ t, onCopy }) {
  const links = [
    { title: 'github', Brand: GithubIcon, v: 'github.com/volempdoge', href: GITHUB_URL },
    { title: 'linkedin', Brand: LinkedinIcon, v: 'linkedin.com/in/volempdoge', href: LINKEDIN_URL },
  ];
  return (
    <section id="cv-contact" className="cv-sec" data-noprint="">
      <SectionHeader title={t.nav.contact} command="mail --to volempdoge" />
      <div className="cv-contact__row">
        <a href={'mailto:' + EMAIL} className="cv-contact__email">
          {EMAIL}
        </a>
        <IconButton icon="content_copy" label={t.copy} variant="secondary" onClick={onCopy} />
      </div>
      <div className="cv-grid2 cv-grid2--tight">
        {links.map(({ title, Brand, v, href }) => (
          <Card
            key={title}
            title={
              <span className="cv-brand">
                <Brand size={16} />
                <span>{title}</span>
              </span>
            }
            meta={v}
            href={href}
          />
        ))}
      </div>
    </section>
  );
}
