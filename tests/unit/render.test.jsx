// @vitest-environment jsdom
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';

const data = {
  now: '2026-10-04T12:00:00.000Z',
  commit: { sha: 'd8e37354f9f6736c5090a735cd5f4592b699159e', url: 'https://example.test/c', date: '2026-09-30' },
};

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('prerender', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('renders the whole CV with the default settings', () => {
    const html = renderToString(<App {...data} />);
    for (const id of ['about', 'experience', 'projects', 'skills', 'education', 'contact']) {
      expect(html).toContain('id="cv-' + id + '"');
    }
    expect(html).toContain('Volodymyr Myronenko');
    expect(html).toContain('Embedded Engineer');
    expect(html).toContain('Test rigs for hardware components.');
    expect(html).toContain('Betaflight OSD Fonts');
    expect(html).not.toContain('KSE Political Studies Club website');
    expect(html).toContain('d8e3735');
  });

  it('hydrates without mismatches, then applies saved settings', async () => {
    const root = document.createElement('div');
    root.innerHTML = renderToString(<App {...data} />);
    document.body.appendChild(root);
    localStorage.setItem('vm-cv2.lang', 'ua');
    localStorage.setItem('vm-cv2.role', 'software');
    window.matchMedia = vi.fn(() => ({ matches: true }));
    const errors = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.join(' ')));
    await act(async () => {
      hydrateRoot(root, <App {...data} />, { onRecoverableError: (e) => errors.push(String(e)) });
    });
    consoleError.mockRestore();
    expect(errors).toEqual([]);
    expect(root.querySelector('h1').textContent).toBe('Володимир Мироненко');
    expect(root.textContent).toContain('Сайт Гуртка політичних студій KSE');
    expect(document.documentElement.lang).toBe('uk');
  });
});
