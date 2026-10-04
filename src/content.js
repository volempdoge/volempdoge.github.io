export const EMAIL = 'volempdoge@gmail.com';
export const GITHUB_URL = 'https://github.com/volempdoge';
export const LINKEDIN_URL = 'https://linkedin.com/in/volempdoge';

export const LANGS = ['en', 'ua'];
export const THEMES = ['night', 'dark', 'light'];
export const ROLES = ['embedded', 'software'];
export const DEFAULTS = { lang: 'en', theme: 'dark', role: 'embedded' };

export const SITE_URL = 'https://volempdoge.github.io';

/** One prerendered page per language; `ua` is the app's code, `uk` the language tag. */
export const PAGES = {
  en: {
    path: '/',
    htmlLang: 'en',
    locale: 'en_US',
    title: 'Volodymyr Myronenko · Embedded & Software Engineer · CV',
    description:
      'Volodymyr Myronenko, embedded and software engineer in Kyiv: firmware in C/C++ for STM32 and ESP32, hardware test rigs and production automation.',
    ogImageAlt: 'Volodymyr Myronenko, Embedded Engineer and Software Engineer, Kyiv, Ukraine',
  },
  ua: {
    path: '/uk/',
    htmlLang: 'uk',
    locale: 'uk_UA',
    title: 'Володимир Мироненко · інженер вбудованих систем і ПЗ · CV',
    description:
      'Володимир Мироненко, інженер вбудованих систем і програмний інженер у Києві: прошивки на C/C++ для STM32 і ESP32, тестові стенди та автоматизація виробництва.',
    ogImageAlt: 'Володимир Мироненко, Embedded Engineer і Software Engineer, Київ, Україна',
  },
};

export const SECTION_IDS = ['about', 'experience', 'projects', 'skills', 'education', 'contact'];
export const SECTION_FILES = {
  about: 'README.md',
  experience: 'work.log',
  skills: 'skills.txt',
  education: 'edu.log',
  contact: 'contact.txt',
};
export const SECTION_ICONS = {
  about: 'person',
  experience: 'work',
  projects: 'folder_open',
  skills: 'build',
  education: 'school',
  contact: 'mail',
};

export const TEXT = {
  en: {
    name: 'Volodymyr Myronenko',
    nav: {
      about: 'about',
      projects: 'projects',
      experience: 'experience',
      skills: 'skills',
      education: 'education',
      contact: 'contact',
    },
    roleCaption: 'focus on relevant projects & skills',
    titles: { embedded: 'Embedded Engineer', software: 'Software Engineer' },
    summary: {
      embedded:
        'Embedded engineer with 3+ years of hardware product development, covering the full cycle from schematic and firmware to test rigs and series production. Currently pursuing an MSc in Micro- and Nanoelectronics at KSE.',
      software:
        'Software engineer with 3+ years of C/C++ and Python in hardware product development: firmware, test tooling and production automation, owned from requirements to delivery. Looking for a software role close to the hardware. Currently pursuing an MSc in Micro- and Nanoelectronics at KSE.',
    },
    contactCta: 'email me',
    pdfCta: 'download pdf',
    printLoc: 'Kyiv, Ukraine',
    termHint: 'try: help',
    now: 'now',
    job: {
      period: 'oct 2023 → now',
      role: 'Embedded Engineer / Team Lead',
      org: 'Electronics product company · under NDA',
      location: 'Kyiv',
      points: {
        lead: {
          h: 'Team lead.',
          t: 'Led projects solo and in teams of up to 3 engineers: planned the work, coordinated the team and acted as the main technical contact for clients.',
        },
        auto: {
          h: 'Production automation system.',
          t: 'Designed and built it from scratch, hardware and software.',
        },
        rigs: {
          h: 'Test rigs for hardware components.',
          t: 'Built in-house rigs, hardware and software, that validate the components’ electronics and firmware against usage scenarios and edge cases.',
        },
        fw: {
          h: 'Device firmware.',
          t: 'Adapted open-source firmware to client requirements: device drivers and UX changes.',
        },
      },
    },
    skillLabels: { lang: 'languages', emb: 'embedded', hw: 'hardware design', tools: 'tools & os' },
    edu: [
      {
        period: '2026 → 2028',
        duration: 'expected',
        role: 'MSc, Micro- and Nanoelectronics',
        org: 'Kyiv School of Economics (KSE) · with ETH Zürich',
        courses: ['VLSI Design', 'RF IC Design', 'Wireless Communications'],
      },
      {
        period: '2022 → 2025',
        duration: '',
        role: 'BSc, Computer Engineering (123)',
        org: 'Kyiv National University of Construction and Architecture (KNUCA)',
        courses: [],
      },
    ],
    spokenTitle: 'languages',
    interestsTitle: 'interests',
    spoken: [
      ['ukrainian', 'native'],
      ['english', 'C1'],
    ],
    interests: ['video editing', 'photography & camera modding', 'experimenting with music', 'design'],
    projects: {
      fonts: {
        file: 'betaflight-osd-fonts.md',
        title: 'Betaflight OSD Fonts',
        meta: 'open source · GPL-3.0',
        href: 'https://volempdoge.github.io/betaflight-designer-fonts/',
        body: 'All ten stock Betaflight OSD fonts as real colour fonts and PNGs. I added Cyrillic, Greek and accented Latin, drawn in each font’s own style.',
      },
      kse: {
        file: 'kse-club-site.md',
        title: 'KSE Political Studies Club website',
        meta: 'maintainer',
        body: 'Maintainer of the website of KSE’s political studies club for school students; took over the codebase from the previous developer and keep improving it.',
      },
    },
    copy: 'copy email',
    copied: 'copied',
    copiedBody: 'to clipboard',
    copyLink: 'copy link to this focus',
    linkCopied: 'link copied',
    commands: 'commands',
    palPh: 'search or type > to run a command',
    palEmpty: 'no matches',
    palGo: 'go to',
    palFocus: 'focus',
    palLook: 'appearance',
    palLang: 'language',
    palAct: 'actions',
    palRecent: 'recent',
    palTerm: 'terminal',
    palNav: 'navigate',
    palRunLbl: 'run',
    palClose: 'close',
    palRunIn: 'run in terminal',
    palResults: 'results',
    themeLabel: 'theme',
    langLabel: 'english',
    langLabelUa: 'українська',
    termLabel: 'terminal',
    termToggle: 'toggle terminal',
    fetchLabel: 'system info (neofetch)',
    resizeHint: 'drag to resize · double click to reset',
    notFound: 'zsh: command not found: ',
  },
  ua: {
    name: 'Володимир Мироненко',
    nav: {
      about: 'про мене',
      projects: 'проєкти',
      experience: 'досвід',
      skills: 'навички',
      education: 'освіта',
      contact: 'контакти',
    },
    roleCaption: 'фокус на релевантних проєктах і навичках',
    titles: { embedded: 'Embedded Engineer', software: 'Software Engineer' },
    summary: {
      embedded:
        'Інженер вбудованих систем із понад 3 роками в розробці апаратних продуктів: повний цикл від схеми та прошивки до тестових стендів і серійного виробництва. Навчаюся в магістратурі KSE за програмою "Мікро- та наноелектроніка".',
      software:
        'Програмний інженер із понад 3 роками C/C++ та Python у розробці апаратних продуктів: прошивки, тестові інструменти, автоматизація виробництва, від вимог до здачі. Шукаю software-роль близько до заліза. Навчаюся в магістратурі KSE за програмою "Мікро- та наноелектроніка".',
    },
    contactCta: 'написати',
    pdfCta: 'завантажити pdf',
    printLoc: 'Київ, Україна',
    termHint: 'спробуйте: help',
    now: 'зараз',
    job: {
      period: 'жовт. 2023 → зараз',
      role: 'Інженер вбудованих систем / тімлід',
      org: 'Компанія-розробник електроніки · NDA',
      location: 'Київ',
      points: {
        lead: {
          h: 'Тімлід.',
          t: 'Вів проєкти самостійно та в командах до 3 інженерів: планував роботи, координував команду, був основним технічним контактом для клієнтів.',
        },
        auto: {
          h: 'Система автоматизації виробництва.',
          t: 'Спроєктував і побудував з нуля, апаратну та програмну частини.',
        },
        rigs: {
          h: 'Тестові стенди для комплектуючих.',
          t: 'Створив внутрішні стенди, залізо й софт, які перевіряють електроніку та прошивку комплектуючих за сценаріями використання та крайніми випадками.',
        },
        fw: {
          h: 'Прошивка пристроїв.',
          t: 'Адаптував open-source прошивки під вимоги клієнтів: драйвери пристроїв та UX.',
        },
      },
    },
    skillLabels: {
      lang: 'мови програмування',
      emb: 'вбудовані системи',
      hw: 'проєктування апаратури',
      tools: 'інструменти та ос',
    },
    edu: [
      {
        period: '2026 → 2028',
        duration: 'очікувано',
        role: 'Магістр, "Мікро- та наноелектроніка"',
        org: 'Київська школа економіки (KSE) · з ETH Zürich',
        courses: ['Проєктування НВІС (VLSI)', 'Проєктування RF IC', 'Бездротові комунікації'],
      },
      {
        period: '2022 → 2025',
        duration: '',
        role: 'Бакалавр, Комп’ютерна інженерія (123)',
        org: 'Київський національний університет будівництва і архітектури (КНУБА)',
        courses: [],
      },
    ],
    spokenTitle: 'мови',
    interestsTitle: 'інтереси',
    spoken: [
      ['українська', 'рідна'],
      ['англійська', 'C1'],
    ],
    interests: ['відеомонтаж', 'фотографія та модифікація камер', 'експерименти з музикою', 'дизайн'],
    projects: {
      fonts: {
        file: 'betaflight-osd-fonts.md',
        title: 'Betaflight OSD Fonts',
        meta: 'open source · GPL-3.0',
        href: 'https://volempdoge.github.io/betaflight-designer-fonts/',
        body: 'Усі десять стандартних OSD-шрифтів Betaflight як справжні кольорові шрифти та PNG. Я додав кирилицю, грецьку та латиницю з діакритикою у стилі кожного шрифту.',
      },
      kse: {
        file: 'kse-club-site.md',
        title: 'Сайт Гуртка політичних студій KSE',
        meta: 'мейнтейнер',
        body: 'Мейнтейнер сайту гуртка політичних студій KSE для школярів: прийняв кодову базу від попереднього розробника та розвиваю її далі.',
      },
    },
    copy: 'скопіювати email',
    copied: 'скопійовано',
    copiedBody: 'у буфер обміну',
    copyLink: 'скопіювати посилання на цей фокус',
    linkCopied: 'посилання скопійовано',
    commands: 'команди',
    palPh: 'пошук або > щоб виконати команду',
    palEmpty: 'нічого не знайдено',
    palGo: 'перейти',
    palFocus: 'focus',
    palLook: 'вигляд',
    palLang: 'мова',
    palAct: 'дії',
    palRecent: 'нещодавні',
    palTerm: 'термінал',
    palNav: 'вибір',
    palRunLbl: 'виконати',
    palClose: 'закрити',
    palRunIn: 'виконати в терміналі',
    palResults: 'результати',
    themeLabel: 'тема',
    langLabel: 'english',
    langLabelUa: 'українська',
    termLabel: 'термінал',
    termToggle: 'показати або сховати термінал',
    fetchLabel: 'інформація про систему (neofetch)',
    resizeHint: 'потягніть, щоб змінити розмір · подвійний клік скидає',
    notFound: 'zsh: command not found: ',
  },
};

export const SKILLS = {
  lang: ['C', 'C++', 'Python', 'Bash'],
  emb: ['STM32', 'ESP32', 'FreeRTOS', 'LoRa', 'SWD/JTAG'],
  hw: ['EasyEDA', 'Altium Designer', 'SystemVerilog', 'Cadence EDA'],
  tools: ['CMake', 'Qt', 'Git', 'CI/CD', 'POSIX', 'Linux', 'LLM APIs', 'Claude Code'],
};
export const STACK = ['C', 'C++', 'Python', 'STM32', 'ESP32', 'FreeRTOS', 'LoRa'];

/** The parts of the CV that change with the focus, in display order. */
export function cvFor(lang, role) {
  const t = TEXT[lang];
  const P = t.job.points;
  const L = t.skillLabels;
  const embedded = role === 'embedded';
  return {
    points: embedded ? [P.rigs, P.auto, P.fw, P.lead] : [P.auto, P.fw, P.lead],
    skills: (embedded ? ['emb', 'lang', 'hw', 'tools'] : ['lang', 'tools', 'emb']).map((k) => ({
      key: k,
      label: L[k],
      items: SKILLS[k],
    })),
    projects: embedded ? [t.projects.fonts] : [t.projects.fonts, t.projects.kse],
    edu: t.edu.map((e) => ({ ...e, courses: embedded ? e.courses : [] })),
  };
}

/** Time in the current job, e.g. "1y 11m" / "1 р 11 міс". */
export function expDuration(lang, now = new Date()) {
  let months = (now.getFullYear() - 2023) * 12 + (now.getMonth() - 9);
  if (months < 0) months = 0;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (lang === 'ua') return (y ? y + ' р' : '') + (m ? (y ? ' ' : '') + m + ' міс' : '');
  return (y ? y + 'y' : '') + (m ? (y ? ' ' : '') + m + 'm' : '');
}
