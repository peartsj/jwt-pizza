import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { Role } from '../src/service/pizzaService';
import type { User } from '../src/service/pizzaService';

export async function basicInit(page: Page, options?: { skipAuth?: boolean }) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, any> = {
    'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
  };

  if (!options?.skipAuth) {
    await page.route('**/api/auth', async (route) => {
      const req = route.request();
      let loginReq: any = {};
      try {
        loginReq = req.postDataJSON();
      } catch (e) {}

      const user = validUsers[loginReq?.email];
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) });
        return;
      }

      loggedInUser = user;
      const loginRes = { user: loggedInUser, token: 'abcdef' };
      expect(['PUT', 'POST']).toContain(req.method());
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginRes) });
    });
  }

  return { getLoggedInUser: () => loggedInUser };
}

export async function mockMenu(page: Page, menuRes?: any[]) {
  const defaultMenu =
    menuRes || [
      { id: 'vegA', title: 'Veggie A', description: 'Delicious Veggie A', image: '/img/vegA.png', price: 0.004 },
      { id: 'pepper', title: 'Pepperoni', description: 'Spicy Pepperoni', image: '/img/pepper.png', price: 0.004 },
    ];
  await page.route('**/api/order/menu', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(defaultMenu) });
  });
}

export async function mockFranchises(page: Page) {
  await page.route('**/api/franchise**', async (route) => {
    const franchisesRes = { franchises: [{ id: 'f1', name: 'Franchise 1', stores: [{ id: '1', name: 'Store 1' }] }], more: false };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(franchisesRes) });
  });
}

export async function mockVersion(page: Page, version = '20000101.000000') {
  await page.route('**/version.json', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version }) });
  });
}

export async function mockUserMe(page: Page, user?: any) {
  const defaultUser = user || { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] };
  await page.route('**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(defaultUser) });
  });
}

export async function mockOrder(page: Page, options?: { fail?: string }) {
  await page.route('**/api/order', async (route) => {
    if (route.request().method() === 'POST') {
      if (options?.fail) {
        await route.fulfill({ status: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: options.fail }) });
        return;
      }
      const orderReq = route.request().postDataJSON();
      expect(route.request().method()).toBe('POST');
      expect(orderReq).toMatchObject({ storeId: '1' });
      const orderRes = { order: { id: 'o1', franchiseId: 'f1', storeId: '1', date: '2026-03-03', items: orderReq.items }, jwt: 'orderjwt' };
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderRes) });
    } else {
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 0, orders: [] }) });
    }
  });
}

export async function setupDefaultMocks(page: Page) {
  await mockMenu(page);
  await mockFranchises(page);
  await mockVersion(page);
  await mockUserMe(page);
  await mockOrder(page);
}

export async function mockAuthAcceptAny(page: Page, defaultUser?: any) {
  await page.route('**/api/auth', async (route) => {
    const req = route.request();
    let body: any = {};
    try {
      body = req.postDataJSON();
    } catch (e) {}
    const user = defaultUser || { id: '1', name: body?.name || 'pizza diner', email: body?.email || 'user@jwt.com', roles: [{ role: Role.Diner }] };
    const res = { user, token: 'abcdef' };
    expect(['PUT', 'POST']).toContain(req.method());
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(res) });
  });
}
