/**
 * Лёгкий мониторинг без обязательного SDK.
 * При SENTRY_DSN — отправляет событие в Sentry Store API.
 */

export async function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[monitoring]", message, context ?? "", stack ?? "");

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    const parsed = parseSentryDsn(dsn);
    if (!parsed) return;

    const payload = {
      event_id: crypto.randomUUID().replace(/-/g, ""),
      timestamp: Date.now() / 1000,
      platform: "node",
      level: "error",
      server_name: process.env.VERCEL_URL || "local",
      environment: process.env.NODE_ENV || "development",
      exception: {
        values: [
          {
            type: error instanceof Error ? error.name : "Error",
            value: message,
            stacktrace: stack
              ? { frames: [{ filename: "app", function: "captureException" }] }
              : undefined,
          },
        ],
      },
      extra: context,
    };

    const url = `https://${parsed.host}/api/${parsed.projectId}/store/`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (sendError) {
    console.error("[monitoring] failed to send to Sentry", sendError);
  }
}

function parseSentryDsn(dsn: string): {
  publicKey: string;
  host: string;
  projectId: string;
} | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    if (!projectId) return null;
    return {
      publicKey: url.username,
      host: url.host,
      projectId,
    };
  } catch {
    return null;
  }
}
