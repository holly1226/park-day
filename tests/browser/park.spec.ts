import { test, expect, type Page } from "@playwright/test";
import { facilities, simulate, layoutKey } from "../../src/data";
const storageKey = "park-day-layout-v2";
async function ready(page: Page) {
  await expect(
    page.getByText("AVA 已完成当前方案查询", { exact: false }),
  ).toBeVisible({ timeout: 65000 });
}
async function time(page: Page, value: string) {
  await page.locator("input[type=time]").fill(value);
  await page.locator("input[type=time]").blur();
  await ready(page);
}
async function worldClick(page: Page, x: number, y: number) {
  await page.locator(".panel-toolbar").scrollIntoViewIfNeeded();
  const box = (await page.locator(".park-svg").boundingBox())!;
  await page.mouse.click(
    box.x + (x / 960) * box.width,
    box.y + (y / 590) * box.height,
  );
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const RealDate = Date;
    const start = RealDate.parse("2026-11-18T09:30:00Z");
    const offset = performance.now();
    class DemoDate extends RealDate {
      constructor(value?: string | number) {
        super(value ?? start + performance.now() - offset);
      }
      static now() {
        return start + performance.now() - offset;
      }
    }
    window.Date = DemoDate as DateConstructor;
  });
});

test("computer clock, real AVA results, visible moving visitors and day/night lighting stay consistent", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await ready(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "ParkWeave · 公园人流与设施模拟器",
  );
  await expect(page.locator(".map-clock strong")).toHaveText("17:30");
  const expected = simulate(facilities, "mild", 17.5);
  await expect(page.locator(".metric-value").first()).toHaveText(
    `${expected.visitors.length}人`,
  );
  await expect(page.locator(".visitor-glyph")).toHaveCount(
    expected.visitors.length,
  );
  const walker = page.locator(".walking-person").first();
  const start = await walker.getAttribute("transform");
  await expect.poll(() => walker.getAttribute("transform")).not.toBe(start);
  await time(page, "22:00");
  await expect(page.locator(".park-svg")).toHaveAttribute("data-phase", "夜晚");
  await expect(page.locator(".lit-lamp")).toHaveCount(5);
  await expect(page.locator(".night-overlay")).toHaveAttribute(
    "opacity",
    "0.6",
  );
  await time(page, "12:00");
  await expect(page.locator(".lit-lamp")).toHaveCount(0);
  await expect(page.locator(".night-overlay")).toHaveAttribute("opacity", "0");
  await page.getByRole("button", { name: "高温天气", exact: true }).click();
  await ready(page);
  await expect(page.locator(".metric-value").first()).toHaveText(
    `${simulate(facilities, "hot", 12).visitors.length}人`,
  );
  for (const text of [
    "哪里还有空位坐？",
    "树荫附近更适合停留吗？",
    "我的布置改变了什么？",
    "夜间哪些设施有照明？",
  ]) {
    await page.getByRole("button", { name: text, exact: false }).click();
    await ready(page);
    await expect(page.locator(".query-steps li")).toHaveCount(3);
    await expect(page.locator(".result-bar")).not.toHaveCount(0);
  }
  await page
    .getByRole("button", { name: "查看 SQL 与结果表", exact: false })
    .click();
  await expect(page.locator(".evidence-panel pre")).toContainText(
    "record_type='facility'",
  );
  await expect(page.locator(".evidence-panel tbody tr")).toHaveCount(12);
  const file = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出结果", exact: true }).click();
  expect((await file).suggestedFilename()).toBe("park-analysis.csv");
  await page.getByRole("button", { name: "回到电脑时间" }).click();
  await expect(page.locator(".map-clock strong")).toHaveText("17:30");
  await page
    .getByRole("button", { name: "模拟规则", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("facility drag/add/remove/undo and persisted layout change the actual AVA dataset", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page
    .getByRole("button", { name: "布置设施", exact: true })
    .first()
    .click();
  const svg = (await page.locator(".park-svg").boundingBox())!;
  const point = (x: number, y: number) => ({
    x: svg.x + (x / 960) * svg.width,
    y: svg.y + (y / 590) * svg.height,
  });
  const from = point(210, 235),
    to = point(250, 260);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).find((f: any) => f.id === "b1")
            .x,
        storageKey,
      ),
    )
    .toBe(250);
  await ready(page);
  await page.getByRole("button", { name: "添加长椅", exact: true }).click();
  await worldClick(page, 430, 365);
  await ready(page);
  await expect(page.locator("[data-facility-id]")).toHaveCount(17);
  await page
    .getByRole("button", { name: "我的布置改变了什么？", exact: false })
    .click();
  await ready(page);
  await page
    .getByRole("button", { name: "查看 SQL 与结果表", exact: false })
    .click();
  await expect(page.locator(".evidence-panel tbody")).toContainText("新增");
  await expect(page.locator(".evidence-panel tbody")).toContainText("移动");
  await page.getByRole("button", { name: "添加树木", exact: true }).click();
  await worldClick(page, 625, 445);
  await ready(page);
  await expect(page.locator("[data-facility-id]")).toHaveCount(18);
  await page.getByRole("button", { name: "移除这处树木", exact: true }).click();
  await ready(page);
  await expect(page.locator("[data-facility-id]")).toHaveCount(17);
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await ready(page);
  await expect(page.locator("[data-facility-id]")).toHaveCount(18);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载方案", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("my-park-layout.json");
  await page.reload();
  await ready(page);
  await expect(page.locator("[data-facility-id]")).toHaveCount(18);
  await page.getByRole("button", { name: "初始布局", exact: true }).click();
  await ready(page);
  await expect(page.locator("[data-facility-id]")).toHaveCount(16);
  await page.getByRole("button", { name: "我的方案", exact: true }).click();
  await ready(page);
  await expect(page.locator("[data-facility-id]")).toHaveCount(18);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    storageKey,
  );
  expect(saved.find((f: any) => f.id === "b1").x).toBe(250);
});

test("invalid water placement is explained, empty and imported layouts work", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page
    .getByRole("button", { name: "布置设施", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "添加长椅", exact: true }).click();
  await worldClick(page, 530, 140);
  await expect(page.getByRole("alert")).toContainText("湖面");
  await expect(page.locator("[data-facility-id]")).toHaveCount(16);
  await page.locator("input[type=file]").setInputFiles({
    name: "empty.json",
    mimeType: "application/json",
    buffer: Buffer.from("[]"),
  });
  await ready(page);
  await expect(page.locator("[data-facility-id]")).toHaveCount(0);
  await expect(
    page.getByText("还没有设施，选一个工具开始布置。"),
  ).toBeVisible();
  await expect(page.locator(".metric-value").last()).not.toHaveText("—人");
  await page.getByRole("button", { name: "重置布局", exact: true }).click();
  await ready(page);
  await expect(page.locator("[data-facility-id]")).toHaveCount(16);
});

test("mobile editor and keyboard movement remain usable without horizontal page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await ready(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "布置设施", exact: true })
    .first()
    .click();
  const bench = page.locator("[data-facility-id=b1]");
  await bench.focus();
  await bench.press("ArrowLeft");
  await ready(page);
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).find((f: any) => f.id === "b1")
            .x,
        storageKey,
      ),
    )
    .toBe(200);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
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
  await page.unroute("**/duckdb/*.wasm");
  await page.getByRole("button", { name: "重新加载" }).click();
  await ready(page);
  await page.route("**/duckdb/*.wasm", (r) => r.abort());
  await page
    .getByRole("button", { name: "布置设施", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "添加长椅", exact: true }).click();
  await worldClick(page, 430, 365);
  await expect(
    page.getByText("分析引擎暂时未能完成查询", { exact: false }),
  ).toBeVisible({ timeout: 65000 });
  await expect(page.locator(".metric-value").first()).toHaveText("—人");
  await page.unroute("**/duckdb/*.wasm");
  await page.getByRole("button", { name: "重新加载" }).click();
  await ready(page);
  await expect(page.locator("[data-facility-id]")).toHaveCount(17);
});
