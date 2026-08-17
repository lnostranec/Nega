import { ForgotPasswordForm } from "@/components/account/ForgotPasswordForm";
import { SiteContainer } from "@/components/layout/SiteContainer";

export const metadata = { title: "Сброс пароля" };

export default function ForgotPasswordPage() {
  return (
    <SiteContainer>
      <ForgotPasswordForm />
    </SiteContainer>
  );
}
