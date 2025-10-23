"use client";

import { Stack } from "@/ui/atoms/stack";
import { Label } from "@/ui/atoms/label";
import { Input } from "@/ui/atoms/input";
import { Button } from "@/ui/atoms/button";
import { Divider } from "@/ui/atoms/divider";
import { Card } from "@/ui/atoms/card";
import { Alert } from "@/ui/atoms/alert";
import {
  registrationMessages,
  useRegistrationForm,
} from "../_hooks/use-registration";

export function RegistrationForm() {
  const { form, mutation, validators } = useRegistrationForm();

  return (
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
            onChange: validators.name,
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
                <Alert tone="danger">
                  {field.state.meta.errors[0]}
                </Alert>
              ) : null}
            </Stack>
          )}
        </form.Field>

        <form.Field
          name="email"
          validators={{
            onChange: validators.email,
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
                <Alert tone="danger">
                  {field.state.meta.errors[0]}
                </Alert>
              ) : null}
            </Stack>
          )}
        </form.Field>

        <Divider />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? registrationMessages.submitting
            : registrationMessages.submit}
        </Button>

        {mutation.isError ? (
          <Alert tone="danger">
            {(mutation.error as Error).message ?? registrationMessages.errorFallback}
          </Alert>
        ) : null}

        {mutation.isSuccess ? (
          <Alert tone="success">{registrationMessages.success}</Alert>
        ) : null}
      </form>
    </Card>
  );
}
