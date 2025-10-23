"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/ui/atoms/button";
import { Input } from "@/ui/atoms/input";
import { Label } from "@/ui/atoms/label";

const profileSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("正しいメールアドレスを入力してください"),
});

export default function Home() {
  const greetingQuery = useQuery({
    queryKey: ["greeting"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return "TanStack Query + Form で構成したフロントエンドのベースです。";
    },
  });

  const [submittedProfile, setSubmittedProfile] = useState<
    z.infer<typeof profileSchema> | null
  >(null);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      setSubmittedProfile(value);
    },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-[var(--spacing-section-gap)] bg-background px-[var(--spacing-page-x)] py-[var(--spacing-page-y)] text-foreground">
      <section className="space-y-[var(--ds-space-element-gap)]">
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit rounded-pill bg-surface-overlay px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Design system baseline
          </span>
          <h1 className="text-3xl font-semibold">Customer Frontend</h1>
        </div>
        <p className="text-base text-text-secondary">
          {greetingQuery.isLoading && "データを取得しています..."}
          {greetingQuery.isSuccess && greetingQuery.data}
        </p>
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface-card p-6 shadow-card">
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
                const result = profileSchema.shape.name.safeParse(value);
                return result.success
                  ? undefined
                  : result.error.issues[0]?.message;
              },
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>お名前</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.value)
                  }
                  placeholder="山田 太郎"
                  autoComplete="name"
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-sm text-status-danger">
                    {field.state.meta.errors[0]}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                const result = profileSchema.shape.email.safeParse(value);
                return result.success
                  ? undefined
                  : result.error.issues[0]?.message;
              },
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>メールアドレス</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.value)
                  }
                  placeholder="example@email.com"
                  autoComplete="email"
                  type="email"
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-sm text-status-danger">
                    {field.state.meta.errors[0]}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <Button type="submit">プロフィールを送信</Button>
        </form>

        {submittedProfile ? (
          <div className="mt-6 rounded-lg border border-border-subtle bg-background/60 p-4 text-sm text-text-secondary">
            <p className="font-medium text-foreground">送信内容</p>
            <p>お名前: {submittedProfile.name}</p>
            <p>メール: {submittedProfile.email}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
