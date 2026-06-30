import type { EmailStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { sendEmail } from "./send";

export type EnqueueEmailInput = {
  to: string;
  subject: string;
  html: string;
  template?: string;
  orderId?: string;
};

const MAX_ATTEMPTS = 3;

export async function enqueueEmail(input: EnqueueEmailInput): Promise<string> {
  const prisma = getPrisma();
  const record = await prisma.emailOutbox.create({
    data: {
      to: input.to,
      subject: input.subject,
      html: input.html,
      template: input.template,
      orderId: input.orderId,
      status: "PENDING",
    },
  });

  void processEmailById(record.id);
  return record.id;
}

export async function processEmailById(id: string): Promise<EmailStatus> {
  const prisma = getPrisma();
  const record = await prisma.emailOutbox.findUnique({ where: { id } });
  if (!record || record.status === "SENT") return record?.status ?? "FAILED";

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.emailOutbox.update({
      where: { id },
      data: { status: "FAILED", lastError: "Max attempts reached" },
    });
    return "FAILED";
  }

  try {
    await sendEmail({
      to: record.to,
      subject: record.subject,
      html: record.html,
    });
    await prisma.emailOutbox.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        attempts: { increment: 1 },
        lastError: null,
      },
    });
    return "SENT";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    await prisma.emailOutbox.update({
      where: { id },
      data: {
        status: record.attempts + 1 >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
        attempts: { increment: 1 },
        lastError: message,
      },
    });
    return record.attempts + 1 >= MAX_ATTEMPTS ? "FAILED" : "PENDING";
  }
}

export async function processPendingEmails(limit = 20): Promise<number> {
  const prisma = getPrisma();
  const pending = await prisma.emailOutbox.findMany({
    where: {
      status: "PENDING",
      attempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let processed = 0;
  for (const record of pending) {
    await processEmailById(record.id);
    processed += 1;
  }
  return processed;
}
