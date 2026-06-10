import { expect, test } from "@playwright/test";

test("interactive terminal runs page commands", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Open with Cmd/Ctrl K" }).click();
  await expect(page.getByRole("dialog", { name: "Interactive terminal" })).toBeVisible();

  const input = page.getByPlaceholder("try: help, spin right, spin up");
  await input.fill("spin counter");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText("Scene mode set to counter-rotation.")).toBeVisible();

  await input.fill("contact");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText("Email: norberto.carosella@gmail.com")).toBeVisible();

  await input.fill("unknown");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText("Command not found: unknown. Type help.")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Interactive terminal" })).not.toBeVisible();
});

test("orbit control toggles the scene state", async ({ page }) => {
  await page.goto("/");

  const breakOrbit = page.getByRole("button", { name: "Break the cube orbit" });
  await breakOrbit.click();

  const restoreOrbit = page.getByRole("button", { name: "Restore the cubes to perfect orbit" });
  await expect(restoreOrbit).toHaveAttribute("aria-pressed", "true");

  await restoreOrbit.click();
  await expect(page.getByRole("button", { name: "Break the cube orbit" })).toHaveAttribute("aria-pressed", "false");
});
