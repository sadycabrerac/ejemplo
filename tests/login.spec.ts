import { expect, test } from '@playwright/test';

import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';

const username = process.env.ORANGEHRM_USERNAME ?? 'Admin';
const password = process.env.ORANGEHRM_PASSWORD ?? 'admin123';

test.describe('Inicio de sesión en OrangeHRM', () => {
  test('permite acceder con credenciales válidas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(username, password);

    await expect(page).toHaveURL(/\/dashboard\/index/);
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('muestra un error con credenciales inválidas', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('usuario-invalido', 'clave-invalida');

    await expect(loginPage.errorMessage).toHaveText('Invalid credentials');
  });
});
