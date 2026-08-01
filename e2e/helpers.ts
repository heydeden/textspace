import { request as pwRequest, type APIRequestContext, type BrowserContext } from '@playwright/test';

let api: APIRequestContext | null = null;
let cachedAdminCookie: string | null = null;

export async function getApi(): Promise<APIRequestContext> {
  if (!api) {
    api = await pwRequest.newContext({ baseURL: 'http://127.0.0.1:3001' });
  }
  return api;
}

export async function adminCookie(): Promise<string> {
  if (cachedAdminCookie) return cachedAdminCookie;
  const login = await (await getApi()).post('/api/auth/login', {
    data: { username: 'setrahden', password: '200114' },
  });
  cachedAdminCookie = login.headers()['set-cookie']?.split(';')[0] ?? '';
  return cachedAdminCookie;
}

export async function setBrowserSession(context: BrowserContext) {
  const cookie = await adminCookie();
  const [name, value] = cookie.split('=');
  await context.addCookies([{ name, value, domain: 'localhost', path: '/' }]);
}

export async function disposeApi() {
  if (api) {
    await api.dispose();
    api = null;
  }
  cachedAdminCookie = null;
}
