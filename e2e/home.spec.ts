import { expect, test } from "@playwright/test";

test("home page presents the professional landing page", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "I build precise, production-ready interfaces for product teams." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Norberto Carosella" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get in touch" }).first()).toHaveAttribute(
    "href",
    "mailto:norberto.carosella@gmail.com",
  );
  await expect(page.getByText("React + TypeScript, end to end")).toBeVisible();
  await expect(page.getByText("Real products, real constraints.")).toBeVisible();
  await expect(page.getByText("Start with the workflow, not the component.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy email address" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("theme toggle switches between dark and light mode", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
