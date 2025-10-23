"use client";

import { PageContainer } from "@/ui/atoms/page-container";
import { PageHeader } from "@/ui/components/page-header";
import { RegistrationForm } from "./_components/registration-form";

export default function RegistrationPage() {

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Specification"
        title="ユーザー登録"
        description="氏名とメールアドレスを入力して、カスタマー向けプロダクトのアカウントを作成します。"
      />

      <RegistrationForm />
    </PageContainer>
  );
}
