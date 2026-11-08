/**
 * Уведомления владельцу магазина в сообщество ВКонтакте.
 * Env: VK_TOKEN — ключ доступа сообщества (право «Сообщения сообщества»),
 *      VK_PEER_ID — id получателя (можно несколько через запятую)
 */

const VK_API_VERSION = "5.199";

export function isVkConfigured(): boolean {
  return Boolean(
    process.env.VK_TOKEN?.trim() && process.env.VK_PEER_ID?.trim(),
  );
}

/** Отправляет текст во все диалоги из VK_PEER_ID. */
export async function sendVkMessage(text: string): Promise<void> {
  if (!isVkConfigured()) {
    console.log("[vk] not configured, message:\n", text);
    return;
  }

  const token = process.env.VK_TOKEN!.trim();
  const peerIds = process.env
    .VK_PEER_ID!.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (peerIds.length === 0) {
    console.log("[vk] no recipients configured, message:\n", text);
    return;
  }

  const results = await Promise.allSettled(
    peerIds.map(async (peerId) => {
      const body = new URLSearchParams({
        access_token: token,
        v: VK_API_VERSION,
        peer_id: peerId,
        random_id: String(Math.floor(Math.random() * 2_147_483_647)),
        message: text,
      });

      const response = await fetch("https://api.vk.com/method/messages.send", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(8_000),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            response?: number;
            error?: { error_code: number; error_msg: string };
          }
        | null;

      if (!data) {
        throw new Error(`VK: invalid response (HTTP ${response.status})`);
      }
      if (data.error) {
        throw new Error(`VK ${data.error.error_code}: ${data.error.error_msg}`);
      }
      return data.response;
    }),
  );

  if (results.every((result) => result.status === "rejected")) {
    throw (results[0] as PromiseRejectedResult).reason;
  }
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[vk] send failed:", result.reason);
    }
  }
}
