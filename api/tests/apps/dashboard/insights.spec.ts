import { test, expect } from "@chromatic-com/playwright";

const url = `${process.env.URL_DASHBOARD}`

test.describe('Dashboard - Insights', () => {

  test('has title', async ({ page }) => {
    await page.goto(url);
  
    await expect(page).toHaveTitle(/ollama\/ollama - Github/);
    await expect(page.getByText('Insight section')).toBeVisible();
    await expect(page.getByText('Pipeline Run Duration')).toBeVisible();
    await expect(await page.$$('#deployment-frequency')).toHaveLength(1);
    await expect(page.getByRole('heading', { name: 'Pairing Index' })).toBeVisible();
  });
});