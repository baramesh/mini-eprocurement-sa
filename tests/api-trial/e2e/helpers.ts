import { Browser, Page } from '@playwright/test';
import { Persona, token } from '../specs/helpers';

export const WEB = process.env.WEB_URL ?? 'http://localhost:8080';

/** a signed-in browser session for one persona (token in localStorage as the SPA expects; SSO itself is out of scope, ADR-05) */
export async function session(browser: Browser, who: Persona, over: Record<string, unknown> = {}): Promise<Page> {
  const ctx = await browser.newContext({ baseURL: WEB, timezoneId: 'Asia/Bangkok', locale: 'th-TH', viewport: { width: 1400, height: 900 } });
  const t = token(who, over);
  await ctx.addInitScript((tok) => { if (!localStorage.getItem('token')) localStorage.setItem('token', tok); }, t);
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  return page;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Buddhist-era dd/mm/yyyy of today + days, Asia/Bangkok (UIR-01) */
export function be(plusDays = 0) {
  const d = new Date(Date.now() + plusDays * 86400e3 + 7 * 3600e3);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear() + 543}`;
}
/** value for <input type=datetime-local> in Asia/Bangkok, plusDays ahead */
export function localDateTime(plusDays: number) {
  const d = new Date(Date.now() + plusDays * 86400e3 + 7 * 3600e3);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
