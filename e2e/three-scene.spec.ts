import { expect, test } from "@playwright/test";

test("three scene renders a nonblank canvas and survives orbit controls", async ({ page }) => {
  await page.goto("/");

  await page.locator(".webgl-wrap.is-ready").waitFor({ timeout: 10_000 });
  await expect(page.locator("#three-scene")).toBeVisible();

  const canvasSize = await page.evaluate(() => {
    const canvas = document.querySelector("#three-scene");
    if (!(canvas instanceof HTMLCanvasElement)) return { height: 0, width: 0 };
    return { height: canvas.height, width: canvas.width };
  });
  const canvasScreenshot = await page.locator("#three-scene").screenshot();
  const nonBlankPixels = await page.evaluate(async (source) => {
    const image = new Image();
    image.src = `data:image/png;base64,${source}`;
    await image.decode();

    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = image.width;
    sampleCanvas.height = image.height;
    const context = sampleCanvas.getContext("2d");
    if (!context) return 0;

    context.drawImage(image, 0, 0);

    const pixel = new Uint8Array(4);
    let nonBlank = 0;

    for (let y = 0.25; y <= 0.75; y += 0.1) {
      for (let x = 0.45; x <= 0.9; x += 0.1) {
        const px = Math.max(0, Math.min(sampleCanvas.width - 1, Math.floor(sampleCanvas.width * x)));
        const py = Math.max(0, Math.min(sampleCanvas.height - 1, Math.floor(sampleCanvas.height * y)));
        pixel.set(context.getImageData(px, py, 1, 1).data);
        if (pixel[3] > 0 && pixel.some((value) => value > 0)) nonBlank += 1;
      }
    }

    return nonBlank;
  }, canvasScreenshot.toString("base64"));

  expect(canvasSize.width).toBeGreaterThan(0);
  expect(canvasSize.height).toBeGreaterThan(0);
  expect(nonBlankPixels).toBeGreaterThan(0);

  await page.mouse.move(80, 160);
  await page.mouse.down();
  await expect(page.locator("html")).not.toHaveAttribute("data-scene-drag", "active");
  await page.mouse.up();

  await page.mouse.move(1000, 160);
  await page.mouse.down();
  await expect(page.locator("html")).toHaveAttribute("data-scene-drag", "active");
  await page.mouse.move(1080, 260, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator("html")).not.toHaveAttribute("data-scene-drag", "active");
  await expect(page.locator(".webgl-wrap.is-ready")).toBeVisible();

  await page.getByRole("button", { name: "Break the cube orbit" }).click();
  await expect(page.getByRole("button", { name: "Restore the cubes to perfect orbit" })).toBeVisible();
  await page.getByRole("button", { name: "Restore the cubes to perfect orbit" }).click();
  await expect(page.locator(".webgl-wrap.is-ready")).toBeVisible();
});
