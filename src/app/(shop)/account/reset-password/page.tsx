import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";
import { SiteContainer } from "@/components/layout/SiteContainer";

export const metadata = { title: "Новый пароль" };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <SiteContainer>
      <ResetPasswordForm token={token ?? ""} />
    </SiteContainer>
  );
}
