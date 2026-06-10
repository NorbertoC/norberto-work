import { expect, test } from "@playwright/test";

test("three scene renders a nonblank canvas and survives orbit controls", async ({ page }) => {
  await page.goto("/");

  await page.locator(".webgl-wrap.is-ready").waitFor({ timeout: 10_000 });
  await expect(page.locator("#three-scene")).toBeVisible();

  const canvasState = await page.evaluate(() => {
    const canvas = document.querySelector("#three-scene");
    if (!(canvas instanceof HTMLCanvasElement)) return { nonBlank: 0, size: { height: 0, width: 0 } };

    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return { nonBlank: 0, size: { height: canvas.height, width: canvas.width } };

    const pixel = new Uint8Array(4);
    let nonBlank = 0;

    for (let y = 0.25; y <= 0.75; y += 0.1) {
      for (let x = 0.45; x <= 0.9; x += 0.1) {
        const px = Math.max(0, Math.min(canvas.width - 1, Math.floor(canvas.width * x)));
        const py = Math.max(0, Math.min(canvas.height - 1, Math.floor(canvas.height * y)));
        gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        if (pixel.some((value) => value > 0)) nonBlank += 1;
      }
    }

    return { nonBlank, size: { height: canvas.height, width: canvas.width } };
  });

  expect(canvasState.size.width).toBeGreaterThan(0);
  expect(canvasState.size.height).toBeGreaterThan(0);
  expect(canvasState.nonBlank).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Break the cube orbit" }).click();
  await expect(page.getByRole("button", { name: "Restore the cubes to perfect orbit" })).toBeVisible();
  await page.getByRole("button", { name: "Restore the cubes to perfect orbit" }).click();
  await expect(page.locator(".webgl-wrap.is-ready")).toBeVisible();
});
