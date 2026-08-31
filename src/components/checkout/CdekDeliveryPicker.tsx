"use client";

import { useEffect, useState } from "react";
import {
  DELIVERY_TYPE_LABELS,
  formatPvzLabel,
  type DeliverySelection,
  type DeliveryType,
} from "@/lib/cdek";
import type { CdekCity, CdekPvz } from "@/lib/cdek-mock-data";
import { formatPrice } from "@/lib/format";

const inputClass =
  "w-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-[#260402]";

type Props = {
  subtotal: number;
  value: DeliverySelection | null;
  onChange: (value: DeliverySelection | null) => void;
};

export function CdekDeliveryPicker({ subtotal, value, onChange }: Props) {
  const [type, setType] = useState<DeliveryType>(value?.type ?? "cdek_pvz");
  const [cityQuery, setCityQuery] = useState(value?.cityName ?? "");
  const [cities, setCities] = useState<CdekCity[]>([]);
  const [city, setCity] = useState<CdekCity | null>(
    value?.cityCode
      ? { code: value.cityCode, name: value.cityName, region: "" }
      : null,
  );
  const [pvzList, setPvzList] = useState<CdekPvz[]>([]);
  const [selectedPvz, setSelectedPvz] = useState<CdekPvz | null>(null);
  const [address, setAddress] = useState(value?.address ?? "");
  const [deliveryCost, setDeliveryCost] = useState(value?.cost ?? 0);
  const [loadingTariff, setLoadingTariff] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const response = await fetch(
        `/api/cdek/cities?q=${encodeURIComponent(cityQuery)}`,
      );
      const data = await response.json();
      const list: CdekCity[] = data.cities ?? [];
      setCities(list);

      const query = cityQuery.trim().toLowerCase();
      if (!city && query.length >= 2 && list.length === 1) {
        const match = list[0];
        if (match.name.toLowerCase() === query) {
          setCity(match);
          setCityQuery(match.name);
          setCities([]);
          setSelectedPvz(null);
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [cityQuery, city]);

  useEffect(() => {
    if (!city) {
      setPvzList([]);
      return;
    }
    void fetch(`/api/cdek/pvz?cityCode=${city.code}`)
      .then((res) => res.json())
      .then((data) => setPvzList(data.pvz ?? []));
  }, [city]);

  useEffect(() => {
    let cancelled = false;
    async function loadTariff() {
      setLoadingTariff(true);
      try {
        const response = await fetch("/api/cdek/tariff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            subtotal,
            cityCode: city?.code,
            address: address.trim() || undefined,
          }),
        });
        const data = await response.json();
        if (!cancelled) setDeliveryCost(data.cost ?? 0);
      } finally {
        if (!cancelled) setLoadingTariff(false);
      }
    }
    void loadTariff();
    return () => {
      cancelled = true;
    };
  }, [type, subtotal, city?.code, address]);

  useEffect(() => {
    if (!city) {
      onChange(null);
      return;
    }

    if (type === "cdek_pvz") {
      if (!selectedPvz) {
        onChange(null);
        return;
      }
      onChange({
        type,
        cityCode: city.code,
        cityName: city.name,
        pvzCode: selectedPvz.code,
        pvzName: formatPvzLabel(selectedPvz),
        cost: deliveryCost,
      });
      return;
    }

    if (type === "cdek_courier" || type === "yandex_courier") {
      if (!address.trim()) {
        onChange(null);
        return;
      }

      onChange({
        type,
        cityCode: city.code,
        cityName: city.name,
        address: address.trim(),
        cost: deliveryCost,
      });
    }
  }, [type, city, selectedPvz, address, deliveryCost, onChange]);

  function selectCity(next: CdekCity) {
    setCity(next);
    setCityQuery(next.name);
    setCities([]);
    setSelectedPvz(null);
  }

  const DELIVERY_OPTIONS: DeliveryType[] = [
    "cdek_pvz",
    "cdek_courier",
    "yandex_courier",
  ];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {DELIVERY_OPTIONS.map((option) => (
          <label
            key={option}
            className={`flex min-w-[12rem] flex-1 cursor-pointer items-center gap-3 border px-4 py-3 transition-colors duration-300 ${
              type === option
                ? "border-brand bg-brand/5"
                : "border-stone-300"
            }`}
          >
            <input
              type="radio"
              name="delivery-type"
              checked={type === option}
              onChange={() => {
                setType(option);
                setSelectedPvz(null);
              }}
            />
            <span className="text-sm">{DELIVERY_TYPE_LABELS[option]}</span>
          </label>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          value={cityQuery}
          onChange={(e) => {
            setCityQuery(e.target.value);
            setCity(null);
            setSelectedPvz(null);
          }}
          placeholder="Город"
          className={inputClass}
          autoComplete="address-level2"
        />
        {cityQuery.trim() && !city && (
          <p className="mt-1 text-xs text-amber-700">
            Выберите город из списка подсказок
          </p>
        )}
        {cities.length > 0 && !city && cityQuery.trim() && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto border border-stone-200 bg-white shadow-lg">
            {cities.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  onClick={() => selectCity(item)}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-stone-50"
                >
                  {item.name}
                  <span className="ml-2 text-stone-400">{item.region}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {type === "cdek_pvz" && city && (
        <div>
          <p className="text-sm text-stone-600">Пункт выдачи</p>
          <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
            {pvzList.map((pvz) => (
              <label
                key={pvz.code}
                className={`flex cursor-pointer gap-3 border px-4 py-3 text-sm transition ${
                  selectedPvz?.code === pvz.code
                    ? "border-brand bg-brand/5"
                    : "border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="pvz"
                  checked={selectedPvz?.code === pvz.code}
                  onChange={() => setSelectedPvz(pvz)}
                />
                <span>
                  <span className="font-medium">{pvz.name}</span>
                  <br />
                  <span className="text-stone-500">{pvz.address}</span>
                  <br />
                  <span className="text-xs text-stone-400">{pvz.workTime}</span>
                </span>
              </label>
            ))}
            {pvzList.length === 0 && (
              <p className="text-sm text-stone-500">ПВЗ в этом городе пока недоступны</p>
            )}
          </div>
        </div>
      )}

      {(type === "cdek_courier" || type === "yandex_courier") && city && (
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Улица, дом, квартира"
          rows={3}
          className={inputClass}
        />
      )}

      <p className="text-sm text-stone-600">
        Стоимость доставки:{" "}
        {loadingTariff ? (
          <span className="text-stone-400">расчёт...</span>
        ) : deliveryCost > 0 ? (
          <span className="font-medium">{formatPrice(deliveryCost)}</span>
        ) : (
          <span className="font-medium text-brand">бесплатно</span>
        )}
      </p>
      <p className="text-xs text-stone-400">
        Тариф предварительный. Стоимость и порог бесплатной доставки задаются в
        настройках магазина.
      </p>
    </div>
  );
}
