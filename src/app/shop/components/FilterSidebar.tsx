"use client";

export type FilterOption = { id: string; name: string; slug: string };

export type ShopFilterControlsProps = {
  categoryOptions: FilterOption[];
  brandOptions: FilterOption[];
  selectedCategories: string[];
  selectedBrands: string[];
  priceInput: { min: number; max: number };
  loadingFilters: boolean;
  onToggleCategory: (slug: string) => void;
  onToggleBrand: (slug: string) => void;
  onPriceInputChange: (key: "min" | "max", value: number) => void;
  onApplyPrice: () => void;
};

export function FilterPanelContent({
  categoryOptions,
  brandOptions,
  selectedCategories,
  selectedBrands,
  priceInput,
  loadingFilters,
  onToggleCategory,
  onToggleBrand,
  onPriceInputChange,
  onApplyPrice,
}: ShopFilterControlsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-4 text-[0.85rem] font-black uppercase tracking-[0.1em] text-[#111]">
          Product Categories
        </h3>
        {loadingFilters ? (
          <SkeletonList />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {categoryOptions.map((cat) => (
              <li key={cat.id}>
                <label className="group flex cursor-pointer items-center gap-3 text-[0.9rem] font-medium text-[#222]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border border-[#cfcfcf] accent-[#03c7fe]"
                    checked={selectedCategories.includes(cat.slug)}
                    onChange={() => onToggleCategory(cat.slug)}
                  />
                  <span className="transition-colors duration-150 group-hover:text-[#03c7fe]">
                    {cat.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <hr className="mt-5 border-0 border-t border-[#ededed]" />
      </div>

      <div>
        <h3 className="mb-4 text-[0.85rem] font-black uppercase tracking-[0.1em] text-[#111]">
          Filter By Price
        </h3>
        <div className="mb-4 grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
          <label className="flex flex-col gap-1 text-[0.85rem] font-semibold text-[#555]">
            Min (LKR)
            <input
              type="number"
              min={0}
              value={priceInput.min}
              onChange={(e) => onPriceInputChange("min", Number(e.target.value))}
              className="w-full rounded-[10px] border border-[#ddd] px-3 py-2 text-[0.9rem] transition-colors focus:border-[#03c7fe] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-[0.85rem] font-semibold text-[#555]">
            Max (LKR)
            <input
              type="number"
              min={0}
              value={priceInput.max}
              onChange={(e) => onPriceInputChange("max", Number(e.target.value))}
              className="w-full rounded-[10px] border border-[#ddd] px-3 py-2 text-[0.9rem] transition-colors focus:border-[#03c7fe] focus:outline-none"
            />
          </label>
        </div>
        <button
          onClick={onApplyPrice}
          className="flex w-full items-center justify-center rounded-full border border-[#525252] bg-[#262626] px-5 py-3 text-[0.85rem] font-bold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:border-[#03c7fe] hover:bg-[#111]"
        >
          Apply Price
        </button>
        <hr className="mt-5 border-0 border-t border-[#ededed]" />
      </div>

      <div>
        <h3 className="mb-4 text-[0.85rem] font-black uppercase tracking-[0.1em] text-[#111]">
          Brands
        </h3>
        {loadingFilters ? (
          <SkeletonList />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {brandOptions.map((brand) => (
              <li key={brand.id}>
                <label className="group flex cursor-pointer items-center gap-3 text-[0.9rem] font-medium text-[#222]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border border-[#cfcfcf] accent-[#03c7fe]"
                    checked={selectedBrands.includes(brand.slug)}
                    onChange={() => onToggleBrand(brand.slug)}
                  />
                  <span className="transition-colors duration-150 group-hover:text-[#03c7fe]">
                    {brand.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function FilterSidebar(props: ShopFilterControlsProps) {
  return (
    <aside className="hidden h-fit w-full rounded-[22px] border border-[#e5e5e5] bg-white p-6 md:sticky md:top-24 md:block">
      <FilterPanelContent {...props} />
    </aside>
  );
}

function SkeletonList({ count = 8 }: { count?: number }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3">
          <div className="h-4 w-4 shrink-0 rounded bg-neutral-200 animate-pulse" />
          <div
            className="h-3 rounded bg-neutral-200 animate-pulse"
            style={{ width: `${50 + (i % 3) * 15}%` }}
          />
        </li>
      ))}
    </ul>
  );
}
