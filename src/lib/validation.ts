const NAME_PATTERN = /^[a-zA-Zа-яА-ЯёЁ]+(?:[ '-][a-zA-Zа-яА-ЯёЁ]+)*$/;

export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Введите имя";
  if (!NAME_PATTERN.test(trimmed)) return "Имя может содержать только буквы";
  return null;
}

export function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Ограничивает ввод: до 11 цифр с «+» или до 10 без кода страны. */
export function sanitizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^\d+\s()-]/g, "");
  const digits = getPhoneDigits(cleaned);
  const maxDigits = cleaned.startsWith("+") ? 11 : 10;

  if (digits.length <= maxDigits) {
    return cleaned;
  }

  let digitCount = 0;
  let result = "";

  for (const char of cleaned) {
    if (/\d/.test(char)) {
      if (digitCount >= maxDigits) continue;
      digitCount += 1;
    }
    result += char;
  }

  return result;
}

export function validatePhone(value: string): string | null {
  const digits = getPhoneDigits(value);
  if (!digits) return "Введите номер телефона";
  if (digits.length === 11 && digits.startsWith("7")) return null;
  if (digits.length === 10) return null;
  return "Введите корректный номер телефона";
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Введите email";
  if (!EMAIL_PATTERN.test(trimmed)) return "Введите корректный email";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Введите пароль";
  if (value.length < 8) return "Пароль должен быть не короче 8 символов";
  return null;
}

export function validatePasswordConfirm(
  password: string,
  confirm: string,
): string | null {
  if (!confirm) return "Повторите пароль";
  if (password !== confirm) return "Пароли не совпадают";
  return null;
}
