import { randomBytes } from "crypto";
import { getPrisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth-types";
import { hashPassword } from "@/lib/auth";
import { enqueueEmail } from "@/lib/email/outbox";

const RESET_TTL_MS = 60 * 60 * 1000;

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function requestPasswordReset(emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const link = `${siteUrl()}/account/reset-password?token=${token}`;
  const shop = process.env.SHOP_NAME ?? "Nega";

  await enqueueEmail({
    to: user.email,
    subject: `Сброс пароля — ${shop}`,
    template: "password_reset",
    html: `<!DOCTYPE html><html lang="ru"><body style="font-family:Arial,sans-serif;color:#260402;max-width:560px;margin:0 auto;padding:24px">
      <p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#78716c">${shop}</p>
      <h1 style="font-size:20px">Сброс пароля</h1>
      <p>Мы получили запрос на сброс пароля для аккаунта ${user.email}.</p>
      <p><a href="${link}" style="color:#260402">Установить новый пароль</a></p>
      <p style="font-size:13px;color:#78716c">Ссылка действует 1 час. Если вы не запрашивали сброс — просто проигнорируйте письмо.</p>
    </body></html>`,
  });
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<"ok" | "invalid" | "expired"> {
  const prisma = getPrisma();
  const row = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!row || row.usedAt) return "invalid";
  if (row.expiresAt < new Date()) return "expired";

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: row.userId } }),
  ]);

  return "ok";
}
