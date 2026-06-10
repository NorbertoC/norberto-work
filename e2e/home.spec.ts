import { expect, test } from "@playwright/test";

test("home page presents the professional landing page", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Interfaces for products that need precision." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Norberto Carosella" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a project conversation" })).toHaveAttribute(
    "href",
    "mailto:norberto.carosella@gmail.com",
  );
  await expect(page.getByText("React + TypeScript")).toBeVisible();
  await expect(page.getByText("Start with the workflow, not the component.")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("theme toggle switches between dark and light mode", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
