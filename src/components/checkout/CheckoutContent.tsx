"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PointsTotal } from "@/components/checkout/PointsTotal";
import { CdekDeliveryPicker } from "@/components/checkout/CdekDeliveryPicker";
import { useAuth } from "@/components/account/AuthModalProvider";
import { Button } from "@/components/ui/Button";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { useCartValidation } from "@/hooks/useCartValidation";
import { formatPrice } from "@/lib/format";
import type { OrderView } from "@/lib/orders";
import type { PromoValidationResult } from "@/lib/promo-codes";
import type { DeliverySelection } from "@/lib/cdek";
import { validateDeliverySelection } from "@/lib/cdek";
import { sanitizePhoneInput, validateEmail } from "@/lib/validation";
import { useCartStore } from "@/store/cart";
import { calculateLoyaltyDiscount } from "@/lib/loyalty-shared";
import { isGiftCertificateVariant } from "@/lib/gift-certificate";

const inputClass =
  "w-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-[#260402]";

type SuccessState = {
  orderNumber: string;
  giftCertificateCodes?: string[];
};

export function CheckoutContent() {
  const router = useRouter();
  const { user, openLogin, refreshUser, loading: authLoading } = useAuth();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const usePoints = useCartStore((s) => s.usePoints);
  const setUsePoints = useCartStore((s) => s.setUsePoints);
  const clearCart = useCartStore((s) => s.clearCart);
  const { messages, validating, revalidate } = useCartValidation();
  const appliedCodeRef = useRef<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [acceptOffer, setAcceptOffer] = useState(false);
  const [delivery, setDelivery] = useState<DeliverySelection | null>(null);
  const [payment, setPayment] = useState("card");
  const [comment, setComment] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(
    null,
  );
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const orderItems = items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    size: item.size,
    color: item.color,
    price: item.price,
    quantity: item.quantity,
    sizeTop: item.sizeTop,
    sizeBottom: item.sizeBottom,
    bottomModel: item.bottomModel,
    bottomVariantId: item.bottomVariantId,
  }));

  const loyaltyPercent = user?.loyaltyPercent ?? 0;
  const discountable = items
    .filter((item) => !isGiftCertificateVariant(item.variantId))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const loyaltyDiscount = calculateLoyaltyDiscount(discountable, loyaltyPercent);

  useEffect(() => {
    if (user?.firstName) setFirstName(user.firstName);
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    appliedCodeRef.current = appliedPromo?.code ?? null;
  }, [appliedPromo]);

  useEffect(() => {
    const code = appliedCodeRef.current;
    if (!code || items.length === 0) return;

    let cancelled = false;

    async function revalidatePromo() {
      setPromoLoading(true);
      try {
        const response = await fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            email: (user?.email ?? guestEmail.trim()) || undefined,
            items: items.map((item) => ({
              variantId: item.variantId,
              price: item.price,
              quantity: item.quantity,
            })),
          }),
        });

        const data = await response.json();
        if (cancelled) return;

        if (response.ok) {
          setAppliedPromo(data.promo);
          setPromoInput(data.promo.code);
          setPromoError(null);
        } else {
          setAppliedPromo(null);
          setPromoError(data.error ?? "РџСЂРѕРјРѕРєРѕРґ Р±РѕР»СЊС€Рµ РЅРµ РґРµР№СЃС‚РІСѓРµС‚");
          appliedCodeRef.current = null;
        }
      } catch {
        if (!cancelled) {
          setPromoError("РќРµ СѓРґР°Р»РѕСЃСЊ РїРµСЂРµСЃС‡РёС‚Р°С‚СЊ РїСЂРѕРјРѕРєРѕРґ");
        }
      } finally {
        if (!cancelled) setPromoLoading(false);
      }
    }

    void revalidatePromo();
    return () => {
      cancelled = true;
    };
  }, [items]);

  async function handleApplyPromo() {
    setPromoError(null);
    setPromoLoading(true);

    try {
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoInput,
          email: (user?.email ?? guestEmail.trim()) || undefined,
          items: orderItems.map((item) => ({
            variantId: item.variantId,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAppliedPromo(null);
        setPromoError(data.error ?? "РџСЂРѕРјРѕРєРѕРґ РЅРµРґРµР№СЃС‚РІРёС‚РµР»РµРЅ");
        return;
      }

      setAppliedPromo(data.promo);
      setPromoInput(data.promo.code);
      appliedCodeRef.current = data.promo.code;
    } catch {
      setPromoError("РћС€РёР±РєР° СЃРµС‚Рё");
    } finally {
      setPromoLoading(false);
    }
  }

  if (items.length === 0 && !success) {
    return (
      <SiteContainer className="py-20">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-stone-600">РљРѕСЂР·РёРЅР° РїСѓСЃС‚Р°</p>
          <Link href="/catalog" className="mt-4 inline-block underline">
            Р’ РєР°С‚Р°Р»РѕРі
          </Link>
        </div>
      </SiteContainer>
    );
  }

  if (success) {
    return (
      <SiteContainer className="py-20">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-2xl font-medium text-[#260402]">Р—Р°РєР°Р· РѕС„РѕСЂРјР»РµРЅ</p>
          <p className="mt-3 text-stone-600">
            РќРѕРјРµСЂ Р·Р°РєР°Р·Р°: <span className="font-medium">{success.orderNumber}</span>
          </p>
          {success.giftCertificateCodes && success.giftCertificateCodes.length > 0 && (
            <div className="mt-6 border border-stone-200 bg-stone-50 p-5 text-left">
              <p className="text-sm font-medium text-[#260402]">
                РљРѕРґС‹ РїРѕРґР°СЂРѕС‡РЅС‹С… СЃРµСЂС‚РёС„РёРєР°С‚РѕРІ
              </p>
              <ul className="mt-3 space-y-2">
                {success.giftCertificateCodes.map((code) => (
                  <li key={code} className="font-mono text-sm text-stone-800">
                    {code}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-stone-500">
                РЎРѕС…СЂР°РЅРёС‚Рµ РєРѕРґС‹ вЂ” РѕРЅРё РґРµР№СЃС‚РІСѓСЋС‚ 1 РіРѕРґ Рё РїСЂРёРјРµРЅСЏСЋС‚СЃСЏ РїСЂРё РѕС„РѕСЂРјР»РµРЅРёРё Р·Р°РєР°Р·Р°.
              </p>
            </div>
          )}
          {user ? (
            <p className="mt-2 text-sm text-stone-500">
              Р—Р°РєР°Р· СЃРѕС…СЂР°РЅС‘РЅ РІ Р»РёС‡РЅРѕРј РєР°Р±РёРЅРµС‚Рµ. Р‘Р°Р»Р»С‹ РЅР°С‡РёСЃР»РµРЅС‹ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.
            </p>
          ) : (
            <p className="mt-2 text-sm text-stone-500">
              Р’РѕР№РґРёС‚Рµ РІ Р°РєРєР°СѓРЅС‚, С‡С‚РѕР±С‹ РІРёРґРµС‚СЊ РёСЃС‚РѕСЂРёСЋ Р·Р°РєР°Р·РѕРІ РІ РїСЂРѕС„РёР»Рµ.{" "}
              <Link href="/order/track" className="underline">
                РћС‚СЃР»РµРґРёС‚СЊ Р·Р°РєР°Р·
              </Link>
            </p>
          )}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {user ? (
              <Link
                href="/account"
                className="btn-site btn-site-filled inline-block bg-brand px-8 py-3 text-sm uppercase tracking-widest text-white"
              >
                Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚
              </Link>
            ) : (
              <button
                type="button"
                onClick={openLogin}
                className="btn-site btn-site-filled inline-block bg-brand px-8 py-3 text-sm uppercase tracking-widest text-white"
              >
                Р’РѕР№С‚Рё
              </button>
            )}
            <Link
              href="/catalog"
              className="btn-site inline-block border border-stone-300 px-8 py-3 text-sm uppercase tracking-widest text-[#260402]"
            >
              РџСЂРѕРґРѕР»Р¶РёС‚СЊ РїРѕРєСѓРїРєРё
            </Link>
          </div>
        </div>
      </SiteContainer>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptOffer) {
      setError("РќРµРѕР±С…РѕРґРёРјРѕ РїСЂРёРЅСЏС‚СЊ СѓСЃР»РѕРІРёСЏ РѕС„РµСЂС‚С‹ Рё РїРѕР»РёС‚РёРєСѓ РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё");
      return;
    }

    const email = user?.email ?? guestEmail.trim();
    if (!user) {
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }
    }

    const deliveryError = validateDeliverySelection(delivery ?? {});
    if (deliveryError) {
      setError(deliveryError);
      return;
    }

    setLoading(true);

    try {
      await revalidate();
      const freshItems = useCartStore.getState().items;

      if (freshItems.length === 0) {
        setError("РљРѕСЂР·РёРЅР° РїСѓСЃС‚Р° РёР»Рё С‚РѕРІР°СЂС‹ РЅРµРґРѕСЃС‚СѓРїРЅС‹");
        return;
      }

      const payloadItems = freshItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        size: item.size,
        color: item.color,
        price: item.price,
        quantity: item.quantity,
        sizeTop: item.sizeTop,
        sizeBottom: item.sizeBottom,
        bottomModel: item.bottomModel,
        bottomVariantId: item.bottomVariantId,
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerName: firstName,
          customerPhone: phone,
          customerEmail: email,
          paymentMethod: payment,
          comment,
          usePoints: user ? usePoints : false,
          promoCode: appliedPromo?.code,
          acceptOffer: true,
          deliveryMethod: delivery!.type,
          deliveryCost: delivery!.cost,
          cdekPvzCode: delivery!.pvzCode,
          cdekPvzName: delivery!.pvzName,
          cdekCityCode: delivery!.cityCode,
          cdekCityName: delivery!.cityName,
          deliveryAddress: delivery!.address,
          items: payloadItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС„РѕСЂРјРёС‚СЊ Р·Р°РєР°Р·");
        return;
      }

      const order = data.order as OrderView;
      const paymentUrl =
        typeof data.paymentUrl === "string" ? data.paymentUrl : null;

      clearCart();
      await refreshUser();

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      if (order.giftCertificateCodes?.length) {
        setSuccess({
          orderNumber: order.orderNumber,
          giftCertificateCodes: order.giftCertificateCodes,
        });
      } else if (user) {
        router.push("/account");
      } else {
        setSuccess({ orderNumber: order.orderNumber });
      }
      router.refresh();
    } catch {
      setError("РћС€РёР±РєР° СЃРµС‚Рё. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteContainer className="py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl text-stone-900">РћС„РѕСЂРјР»РµРЅРёРµ Р·Р°РєР°Р·Р°</h1>

        {messages.length > 0 && (
          <div className="mt-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {messages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        {!user && (
          <div className="mt-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <button type="button" onClick={openLogin} className="underline">
              Р’РѕР№РґРёС‚Рµ
            </button>
            , С‡С‚РѕР±С‹ Р·Р°РєР°Р· СЃРѕС…СЂР°РЅРёР»СЃСЏ РІ Р»РёС‡РЅРѕРј РєР°Р±РёРЅРµС‚Рµ Рё РЅР°С‡РёСЃР»РёР»РёСЃСЊ Р±Р°Р»Р»С‹.
          </div>
        )}

        <div className="mt-8 border border-stone-200 p-6">
          <h2 className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Р’Р°С€ Р·Р°РєР°Р·
          </h2>
          <ul className="mt-4 divide-y divide-stone-100">
            {items.map((item) => (
              <li
                key={item.variantId}
                className="flex items-start justify-between gap-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-stone-900">{item.name}</p>
                  <p className="mt-1 text-stone-500">
                    {[item.color, item.size].filter(Boolean).join(" В· ")}
                    {item.quantity > 1 ? ` В· ${item.quantity} С€С‚.` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-medium">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-stone-200 pt-4">
            <p className="text-sm font-medium text-stone-700">РџСЂРѕРјРѕРєРѕРґ</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  setAppliedPromo(null);
                  setPromoError(null);
                }}
                placeholder="Р’РІРµРґРёС‚Рµ РєРѕРґ"
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoInput.trim()}
                className="btn-site border border-stone-300 px-6 py-3 text-sm uppercase tracking-widest text-[#260402] disabled:opacity-50"
              >
                {promoLoading ? "..." : "РџСЂРёРјРµРЅРёС‚СЊ"}
              </button>
            </div>
            {appliedPromo && (
              <p className="mt-2 text-sm text-brand">
                {appliedPromo.label} (в€’{formatPrice(appliedPromo.discount)})
              </p>
            )}
            {promoError && (
              <p className="mt-2 text-sm text-red-600">{promoError}</p>
            )}
          </div>

          <div className="mt-4 border-t border-stone-200 pt-4">
            <PointsTotal
              subtotal={totalPrice}
              promoDiscount={appliedPromo?.discount ?? 0}
              loyaltyDiscount={loyaltyDiscount}
              loyaltyPercent={user?.loyaltyPercent ?? 0}
              deliveryCost={delivery?.cost ?? 0}
              availablePoints={user?.points ?? 0}
              usePoints={usePoints}
              onUsePointsChange={setUsePoints}
              isLoggedIn={Boolean(user)}
              loading={authLoading}
            />
            {!user && !authLoading && (
              <p className="mt-3 text-xs text-stone-500">
                <button type="button" onClick={openLogin} className="underline">
                  Р’РѕР№РґРёС‚Рµ
                </button>
                , С‡С‚РѕР±С‹ СЃРїРёСЃР°С‚СЊ Р±Р°Р»Р»С‹
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <section>
            <h2 className="text-sm font-medium uppercase tracking-widest text-stone-500">
              РљРѕРЅС‚Р°РєС‚С‹
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="РРјСЏ"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={`sm:col-span-2 ${inputClass}`}
              />
              <input
                type="tel"
                placeholder="РўРµР»РµС„РѕРЅ"
                value={phone}
                onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                required
                className={`sm:col-span-2 ${inputClass}`}
              />
              {user ? (
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className={`sm:col-span-2 ${inputClass} bg-stone-50 text-stone-600`}
                />
              ) : (
                <input
                  type="email"
                  placeholder="Email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={`sm:col-span-2 ${inputClass}`}
                />
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium uppercase tracking-widest text-stone-500">
              Р”РѕСЃС‚Р°РІРєР°
            </h2>
            <CdekDeliveryPicker
              subtotal={Math.max(
                0,
                totalPrice - loyaltyDiscount - (appliedPromo?.discount ?? 0),
              )}
              value={delivery}
              onChange={setDelivery}
            />
          </section>

          <section>
            <h2 className="text-sm font-medium uppercase tracking-widest text-stone-500">
              РЎРїРѕСЃРѕР± РѕРїР»Р°С‚С‹
            </h2>
            <div className="mt-4 space-y-2">
              {[
                { id: "card", label: "Р‘Р°РЅРєРѕРІСЃРєР°СЏ РєР°СЂС‚Р°" },
                { id: "yandex_pay", label: "РЇРЅРґРµРєСЃ РџСЌР№" },
                { id: "split", label: "РЇРЅРґРµРєСЃ РЎРїР»РёС‚" },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition-colors duration-300 ${
                    payment === method.id
                      ? "border-brand bg-brand/5"
                      : "border-stone-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={payment === method.id}
                    onChange={() => setPayment(method.id)}
                  />
                  <span className="text-sm">{method.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-400">
              РўРѕРІР°СЂС‹ СЂРµР·РµСЂРІРёСЂСѓСЋС‚СЃСЏ РЅР° 15 РјРёРЅСѓС‚. РџРѕСЃР»Рµ РѕС„РѕСЂРјР»РµРЅРёСЏ РѕС‚РєСЂРѕРµС‚СЃСЏ СЃС‚СЂР°РЅРёС†Р° РѕРїР»Р°С‚С‹.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium uppercase tracking-widest text-stone-500">
              РљРѕРјРјРµРЅС‚Р°СЂРёР№
            </h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="РџРѕР¶РµР»Р°РЅРёСЏ Рє Р·Р°РєР°Р·Сѓ (РЅРµРѕР±СЏР·Р°С‚РµР»СЊРЅРѕ)"
              rows={3}
              className={`mt-4 ${inputClass}`}
            />
          </section>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={acceptOffer}
              onChange={(e) => setAcceptOffer(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#260402]"
            />
            <span>
              РЇ РїСЂРёРЅРёРјР°СЋ СѓСЃР»РѕРІРёСЏ{" "}
              <Link href="/offer" className="underline hover:text-[#260402]" target="_blank">
                РїСѓР±Р»РёС‡РЅРѕР№ РѕС„РµСЂС‚С‹
              </Link>{" "}
              Рё{" "}
              <Link href="/privacy" className="underline hover:text-[#260402]" target="_blank">
                РїРѕР»РёС‚РёРєРё РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё
              </Link>
            </span>
          </label>

          <Button type="submit" className="w-full" disabled={loading || validating}>
            {loading ? "РћС„РѕСЂРјР»СЏРµРј..." : validating ? "РџСЂРѕРІРµСЂСЏРµРј РєРѕСЂР·РёРЅСѓ..." : "РћС„РѕСЂРјРёС‚СЊ Р·Р°РєР°Р·"}
          </Button>
        </form>
      </div>
    </SiteContainer>
  );
}
