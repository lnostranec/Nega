import {
  commitDolyamiOrder,
  getDolyamiOrderStatus,
  isDolyamiConfigured,
  isDolyamiIp,
  shouldSkipDolyamiIpCheck,
  verifyDolyamiWebhookSignature,
} from "@/lib/dolyami";
import {
  handleExternalPaymentCanceled,
  handleExternalPaymentSucceeded,
} from "@/lib/payments";
import { getClientIp } from "@/lib/yookassa";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";
import { captureException } from "@/lib/monitoring";

type DolyamiWebhookBody = {
  id?: string;
  status?: string;
  amount?: number;
  demo?: boolean;
};

const PAID_STATUSES = new Set(["completed", "committed"]);
const FAIL_STATUSES = new Set(["rejected", "canceled", "cancelled"]);

export async function POST(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isDolyamiConfigured()) {
    return Response.json({ error: "Dolyami not configured" }, { status: 503 });
  }

  if (!shouldSkipDolyamiIpCheck()) {
    const ip = getClientIp(request);
    if (!isDolyamiIp(ip)) {
      console.warn("[dolyami webhook] rejected IP", ip);
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const raw = await request.text();
  const signature =
    request.headers.get("x-partner-sign") ||
    request.headers.get("signature") ||
    request.headers.get("x-signature");

  if (!verifyDolyamiWebhookSignature(raw, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: DolyamiWebhookBody;
  try {
    body = JSON.parse(raw) as DolyamiWebhookBody;
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const applicationId = body.id;
  if (!applicationId) {
    return Response.json({ ok: true });
  }

  try {
    const status = (body.status ?? "").toLowerCase();

    if (status === "wait_for_commit") {
      // Подтверждаем холд — после этого придёт completed
      await commitDolyamiOrder(applicationId);
      return Response.json({ ok: true });
    }

    // Перепроверяем статус в API
    const remote = await getDolyamiOrderStatus(applicationId);
    const remoteStatus = (remote.status || status).toLowerCase();

    if (PAID_STATUSES.has(remoteStatus)) {
      await handleExternalPaymentSucceeded(applicationId);
    } else if (FAIL_STATUSES.has(remoteStatus)) {
      await handleExternalPaymentCanceled(applicationId);
    }
  } catch (error) {
    console.error("[dolyami webhook]", error);
    void captureException(error, { route: "POST /api/payments/dolyami" });
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
