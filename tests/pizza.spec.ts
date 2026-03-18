import { test, expect } from 'playwright-test-coverage';
import type { Page } from '@playwright/test';
import { Role } from '../src/service/pizzaService';
import type { User } from '../src/service/pizzaService';
import { basicInit, mockMenu, mockFranchises, mockVersion, mockUserMe, mockOrder, setupDefaultMocks } from './testHelpers';

test('home page', async ({ page }) => {
  await page.route('**/version.json', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: '20000101.000000' }) });
  });

  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
  await expect(page.getByText('Version: 20000101.000000')).toBeVisible();
});

test('login', async ({ page }) => {
  await basicInit(page);
  await setupDefaultMocks(page);
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);
  await setupDefaultMocks(page);

  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Order now' }).click();
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('1');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page.getByRole('main')).toContainText('0.008 ₿');
});

test('register', async ({ page }) => {
  await basicInit(page);
  await setupDefaultMocks(page);
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('Kai Chen');
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('payment error displays message', async ({ page }) => {
  await basicInit(page);
  await mockMenu(page);
  await mockFranchises(page);
  await mockVersion(page);
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

test('admin dashboard can create and close a franchise', async ({ page }) => {
  await mockVersion(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'abcdef');
  });

  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 1, name: 'Admin', email: 'a@jwt.com', roles: [{ role: 'admin' }] }) });
  });

  await page.route('**/api/franchise**', async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'POST') {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({ name: 'New Franchise', admins: [{ email: 'owner@jwt.com' }] });
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'f2', name: body.name, admins: body.admins, stores: [] }) });
      return;
    }

    if (method === 'DELETE') {
      expect(url).toContain('/api/franchise/af1');
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: 'null' });
      return;
    }

    const franchisesRes = { franchises: [{ id: 'af1', name: 'Admin Franchise', admins: [{ name: 'Admin' }], stores: [{ id: 's1', name: 'Store 1', totalRevenue: 100 }] }], more: false };
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(franchisesRes) });
  });

  await page.goto('http://localhost:5173/admin-dashboard');
  await expect(page.getByText('Franchises')).toBeVisible();

  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await expect(page.getByRole('heading', { name: 'Create franchise' })).toBeVisible();
  await page.getByPlaceholder('franchise name').fill('New Franchise');
  await page.getByPlaceholder('franchisee admin email').fill('owner@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  await page.getByRole('button', { name: 'Close' }).first().click();
  await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/admin-dashboard$/);
});

test('franchise dashboard can create and close a store', async ({ page }) => {
  await mockVersion(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'abcdef');
  });

  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'franchisee' }] }) });
  });

  await page.route('**/api/franchise/**', async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'POST') {
      const body = route.request().postDataJSON();
      expect(url).toContain('/api/franchise/f1/store');
      expect(body).toMatchObject({ name: 'Downtown Store' });
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 's2', name: body.name }) });
      return;
    }

    if (method === 'DELETE') {
      expect(url).toContain('/api/franchise/f1/store/s1');
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: 'null' });
      return;
    }

    const res = [{ id: 'f1', name: 'Franchise 1', admins: [{ name: 'Owner' }], stores: [{ id: 's1', name: 'Store 1', totalRevenue: 12 }] }];
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(res) });
  });

  await page.goto('http://localhost:5173/franchise-dashboard');
  await expect(page.getByText('Franchise 1')).toBeVisible();

  await page.getByRole('button', { name: 'Create store' }).click();
  await expect(page.getByRole('heading', { name: 'Create store' })).toBeVisible();
  await page.getByPlaceholder('store name').fill('Downtown Store');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page).toHaveURL(/\/franchise-dashboard$/);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/franchise-dashboard$/);
});

test('history and logout routes work', async ({ page }) => {
  await mockVersion(page);

  await page.goto('http://localhost:5173/history');
  await expect(page.getByText("It all started in Mama Ricci's kitchen.")).toBeVisible();

  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'abcdef');
  });
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }) });
  });
  await page.route('**/api/auth', async (route) => {
    expect(route.request().method()).toBe('DELETE');
    await route.fulfill({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  });

  await page.goto('http://localhost:5173/logout');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Order now' })).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('token'))).toBeNull();
});