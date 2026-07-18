import { test, expect } from "@playwright/test";

test("landing page renders the hero and nav", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /every skill deserves an opportunity/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get started free" })).toBeVisible();
});

test("signup and login pages render their forms", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("protected routes redirect anonymous visitors to login", async ({ page }) => {
  await page.goto("/feed");
  await expect(page).toHaveURL(/\/login/);
});

test("marketing pages are reachable", async ({ page }) => {
  test.setTimeout(90_000);
  for (const path of ["/about", "/pricing", "/faq", "/privacy", "/terms"]) {
    const response = await page.goto(path, { timeout: 60_000 });
    expect(response?.status()).toBeLessThan(400);
  }
});
