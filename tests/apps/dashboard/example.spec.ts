import { test, expect } from "@chromatic-com/playwright";

const url = `${process.env.URL_DASHBOARD}`

test('has title', async ({ page }) => {
  await page.goto(url);

  await expect(page).toHaveTitle(/ollama\/ollama - Github/);
});
