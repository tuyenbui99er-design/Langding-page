import { test, expect } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
const input = {
  productId: "office-pants",
  color: "Đen",
  size: "M",
  quantity: 1,
  name: "Khách thử nghiệm",
  phone: "0900000000",
  address: "Địa chỉ giả lập, không giao hàng",
  notes: "",
};
for (const width of [320, 360, 390, 430]) {
  test(`mobile checkout and private receipt at ${width}px`, async ({
    page,
    browser,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Quần ống suông cạp cao",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Mua ngay" }).click();
    await expect(page.locator(".error[role=alert]")).toContainText("chọn màu");
    await page.getByRole("button", { name: "Đen", exact: true }).click();
    await page.getByRole("button", { name: "M", exact: true }).click();
    await page.getByRole("button", { name: "Tăng số lượng" }).click();
    await expect(page.locator(".grand dd")).toHaveText(/318.000/);
    await page.getByRole("button", { name: "Mua ngay" }).click();
    await page.getByLabel("Họ và tên").fill(input.name);
    await page.getByLabel("Số điện thoại").fill(input.phone);
    await page.getByLabel("Địa chỉ nhận hàng đầy đủ").fill(input.address);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: /Đặt hàng COD/ }).click();
    await expect(page).toHaveURL(/\/orders\/MC-/);
    await expect(
      page.getByRole("heading", { name: "Cảm ơn bạn." }),
    ).toBeVisible();
    await expect(page.locator(".grand dd")).toHaveText(/318.000/);
    await expect(
      page.getByText("Đã đặt hàng · COD · Chưa thanh toán", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const url = page.url();
    await page.reload();
    await expect(page.getByText(input.address, { exact: true })).toBeVisible();
    const stranger = await browser.newContext();
    const strangerPage = await stranger.newPage();
    const denied = await strangerPage.goto(url);
    expect(denied?.status()).toBe(404);
    await expect(
      strangerPage.getByText(input.address, { exact: true }),
    ).toHaveCount(0);
    await stranger.close();
  });
}
test("API rejects tampering, cross-origin, oversized body; deduplicates retries", async ({
  request,
}) => {
  const headers = {
    Origin: "http://localhost:3100",
    "Idempotency-Key": randomUUID(),
    "X-Receipt-Token": randomBytes(32).toString("hex"),
  };
  expect(
    (
      await request.post("/api/orders", {
        headers: { ...headers, Origin: "https://attacker.invalid" },
        data: input,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/orders", {
        headers,
        data: { ...input, color: "fake" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/orders", {
        headers,
        data: { ...input, notes: "x".repeat(9000) },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/orders", {
        headers: { Origin: headers.Origin },
        data: input,
      })
    ).status(),
  ).toBe(400);
  const payload = {
    ...input,
    phone: "0900000001",
    total: 1,
    unitPrice: 1,
    shipping: 14000,
  };
  const response = await request.post("/api/orders", {
    headers,
    data: payload,
  });
  expect(response.status()).toBe(201);
  const { reference } = await response.json();
  const duplicate = await request.post("/api/orders", {
    headers,
    data: payload,
  });
  expect(duplicate.status()).toBe(201);
  expect((await duplicate.json()).reference).toBe(reference);
  const conflict = await request.post("/api/orders", {
    headers,
    data: { ...payload, quantity: 2 },
  });
  expect(conflict.status()).toBe(409);
  const receipt = await request.get(`/orders/${reference}`);
  expect(receipt.status()).toBe(200);
  expect(await receipt.text()).toContain("189.000");
});

test("committed order survives a lost response without duplicate on retry", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Đen", exact: true }).click();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "Mua ngay" }).click();
  await page.getByLabel("Họ và tên").fill(input.name);
  await page.getByLabel("Số điện thoại").fill("0900000002");
  await page.getByLabel("Địa chỉ nhận hàng đầy đủ").fill(input.address);
  let reference = "";
  await page.route(
    "**/api/orders",
    async (route) => {
      const saved = await route.fetch();
      expect(saved.status()).toBe(201);
      reference = (await saved.json()).reference;
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page.getByRole("button", { name: /Đặt hàng COD/ }).click();
  await expect(page.locator(".error")).toBeVisible();
  const pending = await page.evaluate(() =>
    sessionStorage.getItem("minimal.pending-order.v1"),
  );
  expect(pending).toBeTruthy();
  expect(pending).not.toContain("0900000002");
  expect(pending).not.toContain(input.address);
  await page.reload();
  await page.getByRole("button", { name: "Đen", exact: true }).click();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "Mua ngay" }).click();
  await page.getByLabel("Họ và tên").fill(input.name);
  await page.getByLabel("Số điện thoại").fill("0900000002");
  await page.getByLabel("Địa chỉ nhận hàng đầy đủ").fill(input.address);
  await page.getByRole("button", { name: /Đặt hàng COD/ }).click();
  await expect(page).toHaveURL(new RegExp(reference));
  await expect(
    page.getByRole("heading", { name: "Cảm ơn bạn." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("minimal.pending-order.v1"),
    ),
  ).toBeNull();
});
