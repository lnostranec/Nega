type Props = {
  isActive?: boolean;
  isUsed?: boolean;
  expiresAt: string | null;
};

/** Статус подарочного сертификата: действует / использован / истёк / отключён. */
export function GiftCertificateStatus({ isActive, isUsed, expiresAt }: Props) {
  const expired = expiresAt !== null && new Date(expiresAt) < new Date();

  const [label, className] = isUsed
    ? ["Использован", "bg-stone-100 text-stone-500"]
    : isActive === false
      ? ["Отключён", "bg-red-50 text-red-700"]
      : expired
        ? ["Истёк", "bg-stone-100 text-stone-500"]
        : ["Действует", "bg-green-100 text-green-800"];

  return <span className={`rounded px-2 py-1 text-xs ${className}`}>{label}</span>;
}
