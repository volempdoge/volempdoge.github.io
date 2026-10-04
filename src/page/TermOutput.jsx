import { Prompt } from '../ds/index.js';

const ART = [
  '██╗   ██╗██████╗ ',
  '██║   ██║╚════██╗',
  '██║   ██║ █████╔╝',
  '╚██╗ ██╔╝██╔═══╝ ',
  ' ╚████╔╝ ███████╗',
  '  ╚═══╝  ╚══════╝',
].join('\n');

const SWATCHES = [
  '--accent',
  '--text-heading',
  '--text-body',
  '--text-muted',
  '--text-subtle',
  '--success',
  '--warning',
  '--danger',
];

function Neofetch({ info }) {
  return (
    <div className="cv-fetch">
      <pre>{ART}</pre>
      <div className="cv-fetch__info">
        <div>
          <b>volempdoge</b>
          <span className="cv-fetch__sep">@</span>
          <b>cv</b>
        </div>
        <div className="cv-fetch__sep">-------------</div>
        {info.map(([k, v]) => (
          <div key={k}>
            <span className="cv-fetch__k">{k}</span>
            <span className="cv-fetch__sep">: </span>
            <span className="cv-fetch__v">{v}</span>
          </div>
        ))}
        <div className="cv-fetch__swatches">
          {SWATCHES.map((v) => (
            <span key={v} style={{ background: 'var(' + v + ')' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** One printed terminal line; see src/shell/exec.js for the shapes. */
export function TermLine({ line }) {
  switch (line.kind) {
    case 'cmd':
      return <Prompt path={line.path}>{line.text}</Prompt>;
    case 'segs':
      return (
        <div className="cv-term__line">
          {line.segs.map((sg, i) => (
            <span key={i} style={{ color: sg.color }}>
              {sg.text}
            </span>
          ))}
        </div>
      );
    case 'fetch':
      return (
        <div className="cv-term__line">
          <Neofetch info={line.info} />
        </div>
      );
    default:
      return <div className={'cv-term__line cv-term__line--' + line.kind}>{line.text === '' ? ' ' : line.text}</div>;
  }
}
