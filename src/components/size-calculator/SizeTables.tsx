import {
  BAND_RANGES,
  CUP_RANGES,
  CUPS_BY_BAND,
  HIP_RANGES,
  PANTY_ORDER,
  WAIST_RANGES,
} from "@/lib/size-calculator";

const headCell =
  "border-b border-stone-200 bg-[#f7f1ec] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-stone-600";

function range(min: number, max: number) {
  return `${min}–${max}`;
}

export function BraSizeTable() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[640px] border-collapse text-center text-sm">
        <thead>
          <tr>
            <th className={`${headCell} text-left`}>Под грудью</th>
            {CUP_RANGES.map((cup) => (
              <th key={cup.cup} className={headCell}>
                <span className="block text-base text-[#260402]">{cup.cup}</span>
                <span className="block text-[11px] font-normal normal-case tracking-normal text-stone-500">
                  {range(cup.min, cup.max)} см
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BAND_RANGES.map((band) => {
            const cups = CUPS_BY_BAND[band.band] ?? [];
            return (
              <tr key={band.band} className="border-b border-stone-100">
                <th scope="row" className="px-3 py-3 text-left font-normal">
                  <span className="block text-lg font-semibold text-[#260402]">
                    {band.band}
                  </span>
                  <span className="block text-xs text-stone-500">
                    {range(band.min, band.max)} см
                  </span>
                </th>
                {CUP_RANGES.map((cup) =>
                  cups.includes(cup.cup) ? (
                    <td key={cup.cup} className="px-2 py-3 font-medium text-[#260402]">
                      {band.band}
                      {cup.cup}
                    </td>
                  ) : (
                    <td key={cup.cup} className="bg-stone-50 px-2 py-3 text-stone-300">
                      —
                    </td>
                  ),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PantySizeTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className={headCell}>Размер</th>
            <th className={headCell}>Талия, см</th>
            <th className={headCell}>Бёдра, см</th>
          </tr>
        </thead>
        <tbody>
          {PANTY_ORDER.map((size) => {
            const waist = WAIST_RANGES.find((row) => row.size === size);
            const hips = HIP_RANGES.find((row) => row.size === size);
            return (
              <tr key={size} className="border-b border-stone-100">
                <th scope="row" className="px-3 py-3 text-base font-semibold text-[#260402]">
                  {size}
                </th>
                <td className="px-3 py-3">{waist ? range(waist.min, waist.max) : "—"}</td>
                <td className="px-3 py-3">{hips ? range(hips.min, hips.max) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
