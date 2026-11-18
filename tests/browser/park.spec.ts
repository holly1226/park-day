import { test, expect } from "@playwright/test";
import { observations } from "../../src/data";

test("real browser AVA queries, filters, facilities, evidence and exports work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByText("AVA 4.0 已完成真实查询", { exact: false }),
  ).toBeVisible({ timeout: 65000 });
  const expected = observations
    .filter((r) => r.weather === "mild" && r.hour === 14)
    .reduce((s, r) => s + r.occupied, 0);
  await expect(page.locator(".metric-value").first()).toHaveText(
    `${expected}人`,
  );
  await page.getByRole("button", { name: "高温天气", exact: true }).click();
  const expectedHot = observations
    .filter((r) => r.weather === "hot" && r.hour === 14)
    .reduce((s, r) => s + r.occupied, 0);
  await expect(page.locator(".metric-value").first()).toHaveText(
    `${expectedHot}人`,
  );
  const slider = page.getByRole("slider", { name: "观察时间" });
  await slider.fill("18");
  await expect(page.locator(".map-clock strong")).toHaveText("18:00");
  await expect(page.locator(".metric-value").first()).toHaveText(
    `${observations.filter((r) => r.weather === "hot" && r.hour === 18).reduce((s, r) => s + r.occupied, 0)}人`,
  );
  await page.getByRole("button", { name: "湖畔长椅，", exact: false }).click();
  await expect(page.locator(".selected-card h3")).toContainText("湖畔长椅");
  await page.getByRole("button", { name: "树荫分布", exact: true }).click();
  await expect(
    page.getByText("深色为遮阴示意", { exact: false }),
  ).toBeVisible();
  for (const text of [
    "树荫下，大家待得更久吗？",
    "哪些地方路过多、停留少？",
    "现在，哪里还有位置坐？",
    "热起来后，公园有什么变化？",
  ]) {
    await page.getByRole("button", { name: text, exact: false }).click();
    await expect(page.locator(".answer-loading")).toHaveCount(0);
    await expect(page.locator(".result-bar")).not.toHaveCount(0);
  }
  await page
    .getByRole("button", { name: "查看 SQL 与数据", exact: false })
    .click();
  await expect(page.locator(".evidence-panel pre")).toContainText("hour=18");
  await expect(page.locator(".evidence-panel tbody tr")).toHaveCount(12);
  const file = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出结果", exact: true }).click();
  expect((await file).suggestedFilename()).toBe("park-analysis.csv");
  await page.getByRole("button", { name: "播放公园的一天" }).click();
  await expect(page.locator(".map-clock strong")).not.toHaveText("18:00", {
    timeout: 6000,
  });
  await page.getByRole("button", { name: "暂停时间播放" }).click();
  await page.getByRole("button", { name: "数据与说明", exact: false }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "自由提问" })
    .fill("今天哪里最热闹？");
  await page.getByRole("button", { name: "提问", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("本地");
  expect(errors).toEqual([]);
});

test("mobile viewport fits and facilities remain accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByText("AVA 4.0 已完成真实查询", { exact: false }),
  ).toBeVisible({ timeout: 65000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "香樟树下，", exact: false }).click();
  await expect(page.locator(".selected-card h3")).toContainText("香樟树下");
  await page.screenshot({ path: "docs/preview-mobile.png", fullPage: true });
});

test("missing engine asset exposes an honest recoverable failure", async ({
  page,
}) => {
  await page.route("**/duckdb/*.wasm", (r) => r.abort());
  await page.goto("/");
  await expect(
    page.getByText("分析引擎暂时未能完成查询", { exact: false }),
  ).toBeVisible({ timeout: 65000 });
  await expect(page.getByRole("button", { name: "重新加载" })).toBeVisible();
  await page.unroute("**/duckdb/*.wasm");
  await page.getByRole("button", { name: "重新加载" }).click();
  await expect(
    page.getByText("AVA 4.0 已完成真实查询", { exact: false }),
  ).toBeVisible({ timeout: 65000 });
});
