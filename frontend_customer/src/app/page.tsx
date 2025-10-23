"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-12 bg-white px-6 py-16 text-zinc-900 sm:px-10 lg:px-16">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">Customer Frontend</h1>
        <p className="text-base text-zinc-600">
          {greetingQuery.isLoading && "データを取得しています..."}
          {greetingQuery.isSuccess && greetingQuery.data}
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
        <form
          className="space-y-6"
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">
                  お名前
                </label>
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.value)
                  }
                  placeholder="山田 太郎"
                  autoComplete="name"
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-sm text-red-500">
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">
                  メールアドレス
                </label>
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
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
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-base font-semibold text-white transition hover:bg-zinc-700"
          >
            プロフィールを送信
          </button>
        </form>

        {submittedProfile ? (
          <div className="mt-6 space-y-1 rounded-lg bg-white p-4 text-sm text-zinc-700">
            <p className="font-medium">送信内容</p>
            <p>お名前: {submittedProfile.name}</p>
            <p>メール: {submittedProfile.email}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
