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
      const method = req.method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: { 'Content-Type': 'application/json' }, body: '' });
        return;
      }
      if (method === 'DELETE') {
        await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(null) });
        return;
      }
      expect(['PUT', 'POST']).toContain(method);
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
    const method = req.method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'Content-Type': 'application/json' }, body: '' });
      return;
    }
    if (method === 'DELETE') {
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(null) });
      return;
    }
    expect(['PUT', 'POST']).toContain(method);
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(res) });
  });
}

export async function mockStatefulAuthAndUserUpdate(
  page: Page,
  initialUser: { id: string; name: string; email: string; roles: { role: string }[] },
) {
  const userState = { ...initialUser };

  await page.route('**/api/auth', async (route) => {
    const req = route.request();
    const method = req.method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'Content-Type': 'application/json' }, body: '' });
      return;
    }

    if (method === 'DELETE') {
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(null) });
      return;
    }

    expect(['PUT', 'POST']).toContain(method);

    let body: any = {};
    try {
      body = req.postDataJSON();
    } catch (e) {}

    if (body?.name) {
      userState.name = body.name;
    }
    if (body?.email) {
      userState.email = body.email;
    }

    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: userState, token: 'abcdef' }) });
  });

  await page.route(`**/api/user/${userState.id}`, async (route) => {
    expect(route.request().method()).toBe('PUT');
    const updatedUser = route.request().postDataJSON();

    if (updatedUser?.name) {
      userState.name = updatedUser.name;
    }
    if (updatedUser?.email) {
      userState.email = updatedUser.email;
    }

    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: userState, token: 'abcdef' }) });
  });

  return { getUserState: () => ({ ...userState }) };
}

export type StatefulUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  roles: { role: Role; objectId?: string }[];
};

function cloneStatefulRoles(roles: { role: Role; objectId?: string }[]) {
  return roles.map((role) => ({ ...role }));
}

function toPublicStatefulUser(userState: StatefulUser) {
  return {
    id: userState.id,
    name: userState.name,
    email: userState.email,
    roles: cloneStatefulRoles(userState.roles),
  };
}

export async function setupStatefulUserMocks(page: Page, initialUser: StatefulUser) {
  const userState: StatefulUser = {
    ...initialUser,
    roles: cloneStatefulRoles(initialUser.roles),
  };
  const updateRequests: any[] = [];

  await page.route('**/api/auth', async (route) => {
    const req = route.request();
    const method = req.method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'Content-Type': 'application/json' }, body: '' });
      return;
    }

    if (method === 'DELETE') {
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(null) });
      return;
    }

    let body: any = {};
    try {
      body = req.postDataJSON();
    } catch (e) {}

    if (method === 'PUT') {
      if (body?.email !== userState.email || body?.password !== userState.password) {
        await route.fulfill({ status: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Unauthorized' }) });
        return;
      }

      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: toPublicStatefulUser(userState), token: 'abcdef' }) });
      return;
    }

    if (method === 'POST') {
      userState.name = body?.name || userState.name;
      userState.email = body?.email || userState.email;
      userState.password = body?.password || userState.password;

      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: toPublicStatefulUser(userState), token: 'abcdef' }) });
      return;
    }

    await route.fulfill({ status: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Method not allowed' }) });
  });

  await page.route('**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toPublicStatefulUser(userState)) });
  });

  await page.route(`**/api/user/${userState.id}`, async (route) => {
    expect(route.request().method()).toBe('PUT');
    const updatedUser = route.request().postDataJSON();
    updateRequests.push(updatedUser);

    if (updatedUser?.name !== undefined) {
      userState.name = updatedUser.name;
    }
    if (updatedUser?.email !== undefined) {
      userState.email = updatedUser.email;
    }
    if (updatedUser?.password !== undefined) {
      userState.password = updatedUser.password;
    }
    if (Array.isArray(updatedUser?.roles)) {
      userState.roles = cloneStatefulRoles(updatedUser.roles);
    }

    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: toPublicStatefulUser(userState), token: 'abcdef' }) });
  });

  return {
    getUserState: () => ({ ...userState, roles: cloneStatefulRoles(userState.roles) }),
    getUpdateRequests: () => updateRequests.map((payload) => ({ ...payload, roles: Array.isArray(payload?.roles) ? cloneStatefulRoles(payload.roles) : payload?.roles })),
  };
}

export async function setupUserScenario(page: Page, initialUser: StatefulUser) {
  await mockMenu(page);
  await mockFranchises(page);
  await mockVersion(page);
  await mockOrder(page);
  return setupStatefulUserMocks(page, initialUser);
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
}

export async function loginExpectUnauthorized(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Unauthorized')).toBeVisible();
}

export async function openEditUserDialog(page: Page) {
  await page.goto('/diner-dashboard');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
}

export async function submitUserUpdate(page: Page, updates: { name?: string; email?: string; password?: string }) {
  const dialog = page.locator('#hs-jwt-modal');

  if (updates.name !== undefined) {
    await dialog.locator('input').nth(0).fill(updates.name);
  }

  if (updates.email !== undefined) {
    await dialog.locator('input[type="email"]').fill(updates.email);
  }

  if (updates.password !== undefined) {
    await dialog.locator('#password').fill(updates.password);
  }

  await page.getByRole('button', { name: 'Update' }).click();
  await expect(dialog).toHaveClass(/hidden/);
}
