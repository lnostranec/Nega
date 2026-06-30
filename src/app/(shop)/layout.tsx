import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { AuthModalProvider } from "@/components/account/AuthModalProvider";
import { ConsultationModalProvider } from "@/components/consultation/ConsultationModalProvider";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthModalProvider>
      <ConsultationModalProvider>
        <div className="flex min-h-full flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
        </div>
      </ConsultationModalProvider>
    </AuthModalProvider>
  );
}
