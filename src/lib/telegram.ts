/**
 * Уведомления владельцу магазина в Telegram-бота.
 * Env: TELEGRAM_BOT_TOKEN (от @BotFather), TELEGRAM_CHAT_ID (можно несколько через запятую)
 */

export function isTelegramConfigured(): boolean {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim(),
  );
}

export function escapeTelegramHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Отправляет HTML-сообщение во все чаты из TELEGRAM_CHAT_ID. */
export async function sendTelegramMessage(html: string): Promise<void> {
  if (!isTelegramConfigured()) {
    console.log("[telegram] not configured, message:\n", html);
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN!.trim();
  const chatIds = process.env
    .TELEGRAM_CHAT_ID!.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const results = await Promise.allSettled(
    chatIds.map(async (chatId) => {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: html,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Telegram ${response.status}: ${detail.slice(0, 200)}`);
      }
    }),
  );

  if (results.every((result) => result.status === "rejected")) {
    throw (results[0] as PromiseRejectedResult).reason;
  }
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[telegram] send failed:", result.reason);
    }
  }
}
