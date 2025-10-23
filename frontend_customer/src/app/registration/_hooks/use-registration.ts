"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const registrationSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  email: z.string().email("正しいメールアドレスを入力してください"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

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

const fieldValidators = {
  name: ({ value }: { value: string }) => {
    const result = registrationSchema.shape.name.safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  },
  email: ({ value }: { value: string }) => {
    const result = registrationSchema.shape.email.safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  },
} as const;

export function useRegistrationForm() {
  const mutation = useMutation({
    mutationFn: registerUser,
  });

  const form = useForm<RegistrationInput>({
    defaultValues: {
      name: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return {
    form,
    mutation,
    validators: fieldValidators,
  } as const;
}

export const registrationMessages = {
  success: "アカウント登録が完了しました。",
  submit: "register",
  submitting: "登録処理中...",
  errorFallback: "登録に失敗しました",
} as const;
