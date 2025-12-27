import { test, expect } from "@chromatic-com/playwright";

const url = 'http://localhost:5006'

test('has title', async ({ page }) => {
  await page.goto(url);

  await expect(page).toHaveTitle(/ollama\/ollama - Github/);
});
