import { NextRequest } from "next/server";
import { dbUnavailableResponse, getSessionUser } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";
import { createReview, listActiveReviews } from "@/lib/reviews";

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const reviews = await listActiveReviews();
  return Response.json({ reviews });
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const user = await getSessionUser();
  if (!user) {
    return Response.json(
      { error: "Войдите в систему, чтобы оставить отзыв" },
      { status: 401 },
    );
  }

  let body: { rating?: number; text?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const rating = Number(body.rating);
  const text = typeof body.text === "string" ? body.text : "";

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return Response.json(
      { error: "Поставьте оценку от 1 до 5 звёзд" },
      { status: 400 },
    );
  }

  try {
    const review = await createReview({ userId: user.id, rating, text });
    return Response.json({ review }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "REVIEW_TEXT_EMPTY") {
      return Response.json(
        { error: "Текст отзыва не должен быть пустым" },
        { status: 400 },
      );
    }
    if (code === "REVIEW_TEXT_LONG") {
      return Response.json(
        { error: "Текст отзыва слишком длинный" },
        { status: 400 },
      );
    }
    console.error("Create review error:", error);
    return Response.json({ error: "Не удалось сохранить отзыв" }, { status: 500 });
  }
}
