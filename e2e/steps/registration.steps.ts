import { Given, Then, When } from "@cucumber/cucumber";
import type { DataTable } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { getPrismaClient } from "../support/prisma";
import type { CustomWorld } from "../support/world";

const FIELD_LABELS: Record<string, string> = {
  "氏名": "氏名",
  "メール": "メールアドレス",
  "メールアドレス": "メールアドレス",
};

Given<CustomWorld>("登録画面で必要事項を入力する", async function (table: DataTable) {
  if (!this.page) {
    throw new Error("Playwright page is not initialized");
  }

  const rows = table.hashes();
  const input: Record<string, string> = {};
  const baseUrl = this.baseUrl.replace(/\/$/, "");

  for (const row of rows) {
    input[row["フィールド"]] = row["値"];
  }

  const email = input["メール"] ?? input["メールアドレス"];
  if (email) {
    const prisma = getPrismaClient();
    await prisma.user.deleteMany({ where: { email } });
  }

  this.registration = {
    name: input["氏名"],
    email,
  };

  await this.page.goto(`${baseUrl}/registration`, { waitUntil: "networkidle" });

  for (const row of rows) {
    const fieldLabel = FIELD_LABELS[row["フィールド"]];
    const value = row["値"];

    if (!fieldLabel) {
      throw new Error(`Unsupported field label: ${row["フィールド"]}`);
    }

    await this.page.getByLabel(fieldLabel).fill(value);
  }
});

When<CustomWorld>("register ボタンを押す", async function () {
  if (!this.page) {
    throw new Error("Playwright page is not initialized");
  }

  const responsePromise = this.page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname.endsWith("/customer/users") &&
      response.request().method() === "POST"
    );
  });

  await this.page.getByRole("button", { name: "register" }).click();

  const response = await responsePromise;
  const payload = await response.json();

  if (!this.registration) {
    this.registration = {};
  }
  this.registration.userId = payload?.id;
});

Then<CustomWorld>("アカウント登録が完了したことが表示される", async function () {
  if (!this.page) {
    throw new Error("Playwright page is not initialized");
  }

  await expect(this.page.getByText("アカウント登録が完了しました。")).toBeVisible();

  if (!this.registration?.userId || !this.registration.email) {
    throw new Error("Registration context is missing");
  }

  const prisma = getPrismaClient();
  await expect
    .poll(async () => {
      const user = await prisma.user.findUnique({
        where: { id: this.registration?.userId },
      });

      if (!user) {
        return null;
      }

      return {
        email: user.email,
        name: user.name,
        status: user.status,
      };
    })
    .toEqual({
      email: this.registration.email,
      name: this.registration.name,
      status: "PENDING_VERIFICATION",
    });
});
