import { test, expect } from 'playwright-test-coverage';
import { Role } from '../src/service/pizzaService';
import type { StatefulUser } from './testHelpers';
import {
    loginAs,
    loginExpectUnauthorized,
    openEditUserDialog,
    setupUserScenario,
    submitUserUpdate,
} from './testHelpers';

const roleScenarios: Array<{
    name: string;
    user: StatefulUser;
    expectedRoleText: string;
}> = [
    {
        name: 'diner role',
        user: { id: '11', name: 'Diner User', email: 'diner-role@jwt.com', password: 'diner-pass', roles: [{ role: Role.Diner }] },
        expectedRoleText: 'diner',
    },
    {
        name: 'franchisee role',
        user: {
            id: '12',
            name: 'Franchise Owner',
            email: 'franchisee-role@jwt.com',
            password: 'franchisee-pass',
            roles: [{ role: Role.Franchisee, objectId: 'f1' }],
        },
        expectedRoleText: 'Franchisee on f1',
    },
    {
        name: 'admin role',
        user: { id: '13', name: 'Admin User', email: 'admin-role@jwt.com', password: 'admin-pass', roles: [{ role: Role.Admin }] },
        expectedRoleText: 'admin',
    },
];

test('update user name persists across logout/login', async ({ page }) => {
    const initialUser: StatefulUser = {
        id: '1',
        name: 'pizza diner',
        email: 'user@jwt.com',
        password: 'diner',
        roles: [{ role: Role.Diner }],
    };
    const { getUserState } = await setupUserScenario(page, initialUser);

    await loginAs(page, initialUser.email, initialUser.password);
    await openEditUserDialog(page);
    await submitUserUpdate(page, { name: 'pizza dinerx' });

    await expect(page.getByRole('main')).toContainText('pizza dinerx');
    expect(getUserState().name).toBe('pizza dinerx');

    await page.getByRole('link', { name: 'Logout' }).click();
    await loginAs(page, initialUser.email, initialUser.password);
    await page.goto('/diner-dashboard');
    await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('changing password requires the new password on next login', async ({ page }) => {
    const initialUser: StatefulUser = {
        id: '2',
        name: 'pizza diner',
        email: 'password-user@jwt.com',
        password: 'old-password',
        roles: [{ role: Role.Diner }],
    };
    const newPassword = 'new-password';
    const { getUserState } = await setupUserScenario(page, initialUser);

    await loginAs(page, initialUser.email, initialUser.password);
    await openEditUserDialog(page);
    await submitUserUpdate(page, { password: newPassword });

    expect(getUserState().password).toBe(newPassword);

    await page.getByRole('link', { name: 'Logout' }).click();
    await loginExpectUnauthorized(page, initialUser.email, initialUser.password);

    await page.getByRole('textbox', { name: 'Email address' }).fill(initialUser.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(newPassword);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
});

test('changing email requires the new email on next login', async ({ page }) => {
    const initialUser: StatefulUser = {
        id: '3',
        name: 'pizza diner',
        email: 'old-email@jwt.com',
        password: 'email-password',
        roles: [{ role: Role.Diner }],
    };
    const newEmail = 'new-email@jwt.com';
    const { getUserState } = await setupUserScenario(page, initialUser);

    await loginAs(page, initialUser.email, initialUser.password);
    await openEditUserDialog(page);
    await submitUserUpdate(page, { email: newEmail });

    expect(getUserState().email).toBe(newEmail);

    await page.getByRole('link', { name: 'Logout' }).click();
    await loginExpectUnauthorized(page, initialUser.email, initialUser.password);

    await page.getByRole('textbox', { name: 'Email address' }).fill(newEmail);
    await page.getByRole('textbox', { name: 'Password' }).fill(initialUser.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.goto('/diner-dashboard');
    await expect(page.getByRole('main')).toContainText(newEmail);
});

for (const scenario of roleScenarios) {
    test(`updating user info keeps roles for ${scenario.name}`, async ({ page }) => {
        const { getUserState, getUpdateRequests } = await setupUserScenario(page, scenario.user);
        const updatedName = `${scenario.user.name} Updated`;

        await loginAs(page, scenario.user.email, scenario.user.password);
        await page.goto('/diner-dashboard');
        await expect(page.getByRole('main')).toContainText(scenario.expectedRoleText);

        await openEditUserDialog(page);
        await submitUserUpdate(page, { name: updatedName });

        const updateRequests = getUpdateRequests();
        expect(updateRequests).toHaveLength(1);
        expect(updateRequests[0].roles).toEqual(scenario.user.roles);
        expect(getUserState().roles).toEqual(scenario.user.roles);

        await expect(page.getByRole('main')).toContainText(updatedName);
        await expect(page.getByRole('main')).toContainText(scenario.expectedRoleText);
    });
}