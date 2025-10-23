"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Card } from "@/ui/atoms/card";
import { Stack } from "@/ui/atoms/stack";
import { Label } from "@/ui/atoms/label";
import { Input } from "@/ui/atoms/input";
import { Button } from "@/ui/atoms/button";
import { Divider } from "@/ui/atoms/divider";
import { PageContainer } from "@/ui/atoms/page-container";
import { PageHeader } from "@/ui/components/page-header";

const registrationSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  email: z.string().email("正しいメールアドレスを入力してください"),
});

type RegistrationInput = z.infer<typeof registrationSchema>;

const USER_SERVICE_URL =
  process.env.NEXT_PUBLIC_USER_SERVICE_URL ?? "http://localhost:3001";

async function registerUser(input: RegistrationInput) {
  const response = await fetch(`${USER_SERVICE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = "登録に失敗しました";
    try {
      const payload = await response.json();
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  return response.json();
}

export default function RegistrationPage() {
  const mutation = useMutation({
    mutationFn: registerUser,
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Specification"
        title="ユーザー登録"
        description="氏名とメールアドレスを入力して、カスタマー向けプロダクトのアカウントを作成します。"
      />

      <Card
        title="登録フォーム"
        description="シナリオ <メールアドレスと名前でユーザー登録に成功する> を満たすフォームです。"
      >
        <form
          className="flex flex-col gap-[var(--ds-space-element-gap)]"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                const result = registrationSchema.shape.name.safeParse(value);
                return result.success
                  ? undefined
                  : result.error.issues[0]?.message;
              },
            }}
          >
            {(field) => (
              <Stack gap="xs">
                <Label htmlFor={field.name}>氏名</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  autoComplete="name"
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.value)
                  }
                  placeholder="山田 太郎"
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-sm text-status-danger">
                    {field.state.meta.errors[0]}
                  </p>
                ) : null}
              </Stack>
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                const result = registrationSchema.shape.email.safeParse(value);
                return result.success
                  ? undefined
                  : result.error.issues[0]?.message;
              },
            }}
          >
            {(field) => (
              <Stack gap="xs">
                <Label htmlFor={field.name}>メールアドレス</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  autoComplete="email"
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.value)
                  }
                  placeholder="example@email.com"
                  type="email"
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-sm text-status-danger">
                    {field.state.meta.errors[0]}
                  </p>
                ) : null}
              </Stack>
            )}
          </form.Field>

          <Divider />

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "登録処理中..." : "register"}
          </Button>

          {mutation.isError ? (
            <p className="text-sm text-status-danger">
              {(mutation.error as Error).message}
            </p>
          ) : null}

          {mutation.isSuccess ? (
            <p className="text-sm text-status-success">
              アカウント登録が完了しました。
            </p>
          ) : null}
        </form>
      </Card>
    </PageContainer>
  );
}
