import { test, expect } from 'playwright-test-coverage';
import type { Page } from '@playwright/test';
import { Role } from '../src/service/pizzaService';
import type { User } from '../src/service/pizzaService';

async function basicInit(page: Page, options?: { skipAuth?: boolean }) {
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

async function mockMenu(page: Page, menuRes?: any[]) {
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

async function mockFranchises(page: Page) {
  await page.route('**/api/franchise**', async (route) => {
    expect(route.request().method()).toBe('GET');
  
    await page.route('**/api/franchise', async (route) => {
}

async function mockVersion(page: Page, version = '20000101.000000') {
  await page.route('**/version.json', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version }) });
  });
}

  await page.route('**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(defaultUser) });
  });
  
    await page.route('**/api/franchise/*/store', async (route) => {
async function mockOrder(page: Page, options?: { fail?: string }) {
  await page.route('**/api/order', async (route) => {
    if (route.request().method() === 'POST') {
      if (options?.fail) {
        await route.fulfill({ status: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: options.fail }) });
        return;
      }
      const orderReq = route.request().postDataJSON();
      expect(route.request().method()).toBe('POST');
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderRes) });
    } else {
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 0, orders: [] }) });
    }

async function setupDefaultMocks(page: Page) {
  await mockMenu(page);
  await mockFranchises(page);
  await mockVersion(page);
  await mockUserMe(page);

test('home page', async ({ page }) => {
  await page.route('**/version.json', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: '20000101.000000' }) });
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
  await expect(page.getByText('Version: 20000101.000000')).toBeVisible();
});

test('login', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
test('purchase with login', async ({ page }) => {
  await basicInit(page);
  await setupDefaultMocks(page);

  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Order now' }).click();
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('1');
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await page.getByRole('button', { name: 'Pay now' }).click();

test('register', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('Kai Chen');
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('payment error displays message', async ({ page }) => {
    await page.goto('http://localhost:5173/logout');
  
    await page.waitForURL('http://localhost:5173/');
  await mockUserMe(page);
  await mockOrder(page, { fail: 'Payment failed' });

  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Order now' }).click();
  await page.getByRole('combobox').selectOption('1');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page.getByText('Payment failed')).toBeVisible();
});

test('delivery verify shows payload', async ({ page }) => {
  await mockVersion(page);
  await mockUserMe(page);
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
    history.replaceState({ order: { id: 'o1', items: [{ description: 'Veggie A', price: 0.004 }] }, jwt: 'orderjwt' }, '', '/delivery');
  });
  await page.goto('http://localhost:5173/delivery');

  await page.route('**/api/order/verify', async (route) => {
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'valid', payload: { success: true } }) });
  });

  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByText('valid')).toBeVisible();
});

test('admin dashboard renders', async ({ page }) => {
  await mockVersion(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'abcdef');
  });
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 1, name: 'Admin', email: 'a@jwt.com', roles: [{ role: 'admin' }] }) });
  });
  await page.route('**/api/franchise**', async (route) => {
    const franchisesRes = { franchises: [{ id: 'af1', name: 'Admin Franchise', admins: [{ name: 'Admin' }], stores: [{ id: 's1', name: 'Store 1', totalRevenue: 100 }] }], more: false };
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(franchisesRes) });
  });

  await page.goto('http://localhost:5173/admin-dashboard');
  await expect(page.getByText('Franchises')).toBeVisible();
});

test('franchise dashboard renders stores', async ({ page }) => {
  await mockVersion(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'abcdef');
  });
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'franchisee' }] }) });
  });
  await page.route('**/api/franchise/*', async (route) => {
    const res = [{ id: 'f1', name: 'Franchise 1', admins: [{ name: 'Owner' }], stores: [{ id: '1', name: 'Store 1', totalRevenue: 12 }] }];
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(res) });
  });

  await page.goto('http://localhost:5173/franchise-dashboard');
  await expect(page.getByText('Franchise 1')).toBeVisible();
});

test('diner dashboard shows buy link when no orders', async ({ page }) => {
  await mockVersion(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'abcdef');
  });
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }) });
  });
  await page.route('**/api/order', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 0, orders: [] }) });
  });

  await page.goto('http://localhost:5173/diner-dashboard');
  await expect(page.getByText('Buy one')).toBeVisible();
});

test('docs page renders endpoints', async ({ page }) => {
  await mockVersion(page);
  await page.route('**/api/docs', async (route) => {
    const docs = { endpoints: [{ requiresAuth: false, method: 'GET', path: '/api/test', description: 'test', example: 'curl', response: { ok: true } }] };
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docs) });
  });
  await page.goto('http://localhost:5173/docs/service');
  await expect(page.getByText('/api/test')).toBeVisible();
});

test('about page renders content', async ({ page }) => {
  await mockVersion(page);
  await page.goto('http://localhost:5173/about');
  await expect(page.getByRole('heading', { name: 'Our employees' })).toBeVisible();
});

test('admin dashboard interactions', async ({ page }) => {
  await mockVersion(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'abcdef');
  });

  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 1, name: 'Admin', email: 'a@jwt.com', roles: [{ role: 'admin' }] }) });
  });

  await page.route('**/api/franchise*', async (route) => {
    const url = route.request().url();
    if (url.includes('limit=10')) {
      const franchisesRes = { franchises: [{ id: 'f2', name: 'Filtered Franchise', admins: [{ name: 'Admin' }], stores: [] }], more: false };
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(franchisesRes) });
      return;
    }

    const franchisesRes = { franchises: [{ id: 'af1', name: 'Admin Franchise', admins: [{ name: 'Admin' }], stores: [{ id: 's1', name: 'Store 1', totalRevenue: 100 }] }], more: false };
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(franchisesRes) });
  });

  await page.goto('http://localhost:5173/admin-dashboard');
  await expect(page.getByText('Franchises')).toBeVisible();

  await page.fill('input[name="filterFranchise"]', 'Filtered');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Filtered Franchise')).toBeVisible();

  await page.getByRole('button', { name: 'Add Franchise' }).click();
  const url = new URL(await page.url());
  expect(url.pathname).toContain('/admin-dashboard/create-franchise');
});

test('coverage: untested views', async ({ page }) => {
  // ensure version is mocked
  await mockVersion(page);

  // create franchise POST handler
  await page.route('**/api/franchise', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      const body = req.postDataJSON();
      expect(body).toMatchObject({ name: 'Test Franchise', admins: [{ email: 'admin@test.com' }] });
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'nf1', name: body.name, stores: [], admins: body.admins }) });
      return;
    }
    await route.continue();
  });

  // visit create franchise page and submit
  await page.goto('http://localhost:5173/create-franchise');
  await page.locator('input[placeholder="franchise name"]').fill('Test Franchise');
  await page.locator('input[placeholder="franchisee admin email"]').fill('admin@test.com');
  await page.getByRole('button', { name: 'Create' }).click();

  // create store POST handler
  await page.route('**/api/franchise/*/store', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      const body = req.postDataJSON();
      expect(body).toMatchObject({ name: 'New Store' });
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 's1', name: body.name }) });
      return;
    }
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([]) });
  });

  // navigate to create store with state
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => history.replaceState({ franchise: { id: 'f1', name: 'F1' } }, '', '/create-store'));
  await page.goto('http://localhost:5173/create-store');
  await page.locator('input[placeholder="store name"]').fill('New Store');
  await page.getByRole('button', { name: 'Create' }).click();

  // prepare admin token and user so close-franchise renders
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'abcdef');
  });
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 1, name: 'Admin', email: 'a@jwt.com', roles: [{ role: 'admin' }] }) });
  });

  // provide franchise list (for admin dashboard) including a store to exercise close-store and close-franchise flows
  await page.route('**/api/franchise**', async (route) => {
    const franchisesRes = { franchises: [{ id: 'cf1', name: 'CloseMe', stores: [{ id: 's2', name: 'Store2', totalRevenue: 123 }] }], more: false };
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(franchisesRes) });
  });

  // close store DELETE handler
  await page.route('**/api/franchise/*/store/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      return;
    }
    await route.continue();
  });

  // close franchise DELETE handler
  await page.route('**/api/franchise/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      return;
    }
    await route.continue();
  });

  // navigate to admin dashboard and click the store Close (navigates to close-store), then confirm
  await page.goto('http://localhost:5173/admin-dashboard');
  await expect(page.getByText('Franchises')).toBeVisible();
  const storeRow = page.locator('tr', { hasText: 'Store2' }).first();
  await expect(storeRow.getByRole('button', { name: 'Close' })).toBeVisible();
  await storeRow.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Sorry to see you go')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // return to admin dashboard and click franchise Close to exercise close-franchise
  await page.goto('http://localhost:5173/admin-dashboard');
  await expect(page.getByText('Franchises')).toBeVisible();
  const franchiseTbody = page.locator('tbody', { hasText: 'CloseMe' }).first();
  const franchiseCloseBtn = franchiseTbody.locator('tr').first().getByRole('button', { name: 'Close' });
  await expect(franchiseCloseBtn).toBeVisible();
  await franchiseCloseBtn.click();
  await expect(page.getByText('Sorry to see you go')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // visit history page
  await page.goto('http://localhost:5173/history');
  await expect(page.getByRole('heading', { name: 'Mama Rucci, my my' })).toBeVisible();

  // logout flow: ensure token removed and DELETE auth intercepted
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'abcdef');
  });
  await page.route('**/api/auth', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      return;
    }
    await route.continue();
  });

  await page.goto('http://localhost:5173/logout');
  // the Logout component navigates immediately back to '/', wait for that navigation
  await page.waitForURL('http://localhost:5173/');
  const token = await page.evaluate(() => window.localStorage.getItem('token'));
  expect(token).toBeNull();
});