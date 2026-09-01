/**
 * Проверка отправки почты через Resend.
 * Usage: node --env-file=.env scripts/test-email.mjs you@example.com
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const to = process.argv[2];
if (!to) {
  console.error("Usage: node --env-file=.env scripts/test-email.mjs recipient@email.com");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.EMAIL_FROM ?? "Nega Shop <onboarding@resend.dev>";

if (!apiKey) {
  console.error("RESEND_API_KEY не задан в .env");
  console.error("1. Зарегистрируйтесь на https://resend.com");
  console.error("2. API Keys → Create → вставьте в .env");
  process.exit(1);
}

const shop = process.env.SHOP_NAME ?? "Nega";

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject: `Тест почты — ${shop}`,
    html: `<p>Если вы видите это письмо, Resend настроен.</p><p>Отправитель: <code>${from}</code></p>`,
  }),
});

const text = await response.text();
if (!response.ok) {
  console.error(`Ошибка Resend ${response.status}:`, text);
  process.exit(1);
}

console.log("OK:", text);
