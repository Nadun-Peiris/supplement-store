"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Loader2, Wand2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { ProductDTO, ProductNutrientDTO, ProductServingInfoDTO } from "@/types/product";
import {
  defaultNutritionFacts,
  parseNutritionFactsText,
} from "@/lib/productNutrition";

type ProductEditorState = {
  id?: string;
  originalSlug?: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  brandName: string;
  brandSlug: string;
  price: string;
  discountPrice: string;
  currency: string;
  image: string;
  hoverImage: string;
  galleryText: string;
  description: string;
  overview: string;
  ingredientsText: string;
  benefitsText: string;
  howToUseText: string;
  warningsText: string;
  additionalInfoText: string;
  stock: string;
  isActive: boolean;
  coaCertificateUrl: string;
  coaVerified: boolean;
  nutritionRawText: string;
  servingInfo: ProductServingInfoDTO;
};

const arrayToTextarea = (value?: string[]) => (value ?? []).join("\n");

const textareaToArray = (value: string) =>
  value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

const createEmptyProduct = (): ProductEditorState => ({
  name: "",
  slug: "",
  category: "",
  categorySlug: "",
  brandName: "",
  brandSlug: "",
  price: "",
  discountPrice: "",
  currency: "LKR",
  image: "",
  hoverImage: "",
  galleryText: "",
  description: "",
  overview: "",
  ingredientsText: "",
  benefitsText: "",
  howToUseText: "",
  warningsText: "",
  additionalInfoText: "",
  stock: "0",
  isActive: true,
  coaCertificateUrl: "",
  coaVerified: false,
  nutritionRawText: "",
  servingInfo: defaultNutritionFacts(),
});

const mapProductToForm = (product: ProductDTO): ProductEditorState => ({
  id: product._id,
  originalSlug: product.slug,
  name: product.name ?? "",
  slug: product.slug ?? "",
  category: product.category ?? "",
  categorySlug: product.categorySlug ?? "",
  brandName: product.brandName ?? "",
  brandSlug: product.brandSlug ?? "",
  price: String(product.price ?? ""),
  discountPrice:
    typeof product.discountPrice === "number" ? String(product.discountPrice) : "",
  currency: product.currency ?? "LKR",
  image: product.image ?? "",
  hoverImage: product.hoverImage ?? "",
  galleryText: (product.gallery ?? []).join("\n"),
  description: product.description ?? "",
  overview: product.details?.overview ?? "",
  ingredientsText: arrayToTextarea(product.details?.ingredients),
  benefitsText: arrayToTextarea(product.details?.benefits),
  howToUseText: arrayToTextarea(product.details?.howToUse),
  warningsText: arrayToTextarea(product.details?.warnings),
  additionalInfoText: arrayToTextarea(product.details?.additionalInfo),
  stock: String(product.stock ?? 0),
  isActive: product.isActive ?? true,
  coaCertificateUrl: product.coa?.certificateUrl ?? "",
  coaVerified: product.coa?.verified ?? false,
  nutritionRawText: "",
  servingInfo: {
    ...defaultNutritionFacts(),
    ...product.details?.servingInfo,
    nutrients: product.details?.servingInfo?.nutrients ?? [],
  },
});

const inputClass =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#03c7fe] focus:ring-4 focus:ring-[#03c7fe]/10";
const labelClass = "mb-2 block text-xs font-black uppercase tracking-[0.18em] text-gray-500";

export default function DashboardProductsPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [form, setForm] = useState<ProductEditorState>(createEmptyProduct);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data: ProductDTO[] = await response.json();
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const setField = <K extends keyof ProductEditorState>(
    key: K,
    value: ProductEditorState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setServingInfo = (patch: Partial<ProductServingInfoDTO>) => {
    setForm((current) => ({
      ...current,
      servingInfo: {
        ...current.servingInfo,
        ...patch,
      },
    }));
  };

  const setNutrientRow = (
    index: number,
    patch: Partial<ProductNutrientDTO>
  ) => {
    setForm((current) => ({
      ...current,
      servingInfo: {
        ...current.servingInfo,
        nutrients: (current.servingInfo.nutrients ?? []).map((row, rowIndex) =>
          rowIndex === index ? { ...row, ...patch } : row
        ),
      },
    }));
  };

  const addNutrientRow = () => {
    setForm((current) => ({
      ...current,
      servingInfo: {
        ...current.servingInfo,
        nutrients: [
          ...(current.servingInfo.nutrients ?? []),
          { name: "", amount: "", dailyValue: "", indentLevel: 0, emphasized: false },
        ],
      },
    }));
  };

  const removeNutrientRow = (index: number) => {
    setForm((current) => ({
      ...current,
      servingInfo: {
        ...current.servingInfo,
        nutrients: (current.servingInfo.nutrients ?? []).filter(
          (_, rowIndex) => rowIndex !== index
        ),
      },
    }));
  };

  const parseNutrition = () => {
    const parsed = parseNutritionFactsText(form.nutritionRawText);
    setServingInfo(parsed);
    toast.success("Nutrition facts parsed");
  };

  const selectProduct = (product: ProductDTO) => {
    setForm(mapProductToForm(product));
  };

  const resetForm = () => {
    setForm(createEmptyProduct());
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.price.trim() || !form.image.trim()) {
      toast.error("Name, category, price, and image are required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        category: form.category,
        categorySlug: form.categorySlug,
        brandName: form.brandName,
        brandSlug: form.brandSlug,
        price: form.price,
        discountPrice: form.discountPrice,
        currency: form.currency,
        image: form.image,
        hoverImage: form.hoverImage,
        gallery: textareaToArray(form.galleryText),
        description: form.description,
        stock: form.stock,
        isActive: form.isActive,
        coa: {
          certificateUrl: form.coaCertificateUrl,
          verified: form.coaVerified,
        },
        details: {
          overview: form.overview,
          ingredients: textareaToArray(form.ingredientsText),
          benefits: textareaToArray(form.benefitsText),
          howToUse: textareaToArray(form.howToUseText),
          warnings: textareaToArray(form.warningsText),
          additionalInfo: textareaToArray(form.additionalInfoText),
          servingInfo: {
            ...form.servingInfo,
            nutrients: (form.servingInfo.nutrients ?? []).map((row) => ({
              name: row.name ?? "",
              amount: row.amount ?? "",
              dailyValue: row.dailyValue ?? "",
              indentLevel: Number(row.indentLevel ?? 0),
              emphasized: Boolean(row.emphasized),
            })),
          },
        },
      };

      const isEditing = Boolean(form.originalSlug);
      const endpoint = isEditing
        ? `/api/products/${encodeURIComponent(form.originalSlug ?? "")}`
        : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      const savedProduct = data.product?.product ?? data.product ?? null;
      if (savedProduct) {
        setForm(mapProductToForm(savedProduct as ProductDTO));
      }

      toast.success(isEditing ? "Product updated" : "Product created");
      await loadProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
              Products
            </p>
            <h1 className="mt-2 text-2xl font-black text-gray-900">Catalog Admin</h1>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#03c7fe] text-white shadow-[0_10px_24px_rgba(3,199,254,0.22)]"
            title="New product"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading products...
            </div>
          ) : (
            products.map((product) => {
              const isActive = form.id === product._id;

              return (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => selectProduct(product)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-[#03c7fe] bg-[#f2fbff] shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-bold text-gray-900">{product.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-400">
                    {product.category}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
                Editor
              </p>
              <h2 className="mt-2 text-2xl font-black text-gray-900">
                {form.originalSlug ? "Edit Product" : "Create Product"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
              Save Product
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className={labelClass}>Name</label>
              <input className={inputClass} value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Slug</label>
              <input className={inputClass} value={form.slug} onChange={(e) => setField("slug", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <input className={inputClass} value={form.category} onChange={(e) => setField("category", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Category Slug</label>
              <input className={inputClass} value={form.categorySlug} onChange={(e) => setField("categorySlug", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <input className={inputClass} value={form.brandName} onChange={(e) => setField("brandName", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Brand Slug</label>
              <input className={inputClass} value={form.brandSlug} onChange={(e) => setField("brandSlug", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Price</label>
              <input className={inputClass} value={form.price} onChange={(e) => setField("price", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Discount Price</label>
              <input className={inputClass} value={form.discountPrice} onChange={(e) => setField("discountPrice", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <input className={inputClass} value={form.currency} onChange={(e) => setField("currency", e.target.value)} />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className={labelClass}>Primary Image</label>
              <input className={inputClass} value={form.image} onChange={(e) => setField("image", e.target.value)} />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className={labelClass}>Hover Image</label>
              <input className={inputClass} value={form.hoverImage} onChange={(e) => setField("hoverImage", e.target.value)} />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className={labelClass}>Gallery Images</label>
              <textarea
                className={`${inputClass} min-h-28`}
                value={form.galleryText}
                onChange={(e) => setField("galleryText", e.target.value)}
                placeholder="One image URL per line"
              />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input className={inputClass} value={form.stock} onChange={(e) => setField("stock", e.target.value)} />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setField("isActive", e.target.checked)} />
                Active
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={form.coaVerified} onChange={(e) => setField("coaVerified", e.target.checked)} />
                COA Verified
              </label>
            </div>
            <div>
              <label className={labelClass}>COA URL</label>
              <input className={inputClass} value={form.coaCertificateUrl} onChange={(e) => setField("coaCertificateUrl", e.target.value)} />
            </div>
          </div>

          <div className="mt-5">
            <label className={labelClass}>Description</label>
            <textarea className={`${inputClass} min-h-28`} value={form.description} onChange={(e) => setField("description", e.target.value)} />
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-gray-900">Product Details</h3>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="xl:col-span-2">
              <label className={labelClass}>Overview</label>
              <textarea className={`${inputClass} min-h-28`} value={form.overview} onChange={(e) => setField("overview", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Ingredients</label>
              <textarea className={`${inputClass} min-h-32`} value={form.ingredientsText} onChange={(e) => setField("ingredientsText", e.target.value)} placeholder="One item per line" />
            </div>
            <div>
              <label className={labelClass}>Benefits</label>
              <textarea className={`${inputClass} min-h-32`} value={form.benefitsText} onChange={(e) => setField("benefitsText", e.target.value)} placeholder="One item per line" />
            </div>
            <div>
              <label className={labelClass}>How To Use</label>
              <textarea className={`${inputClass} min-h-32`} value={form.howToUseText} onChange={(e) => setField("howToUseText", e.target.value)} placeholder="One step per line" />
            </div>
            <div>
              <label className={labelClass}>Warnings</label>
              <textarea className={`${inputClass} min-h-32`} value={form.warningsText} onChange={(e) => setField("warningsText", e.target.value)} placeholder="One warning per line" />
            </div>
            <div className="xl:col-span-2">
              <label className={labelClass}>Additional Info</label>
              <textarea className={`${inputClass} min-h-28`} value={form.additionalInfoText} onChange={(e) => setField("additionalInfoText", e.target.value)} placeholder="One note per line" />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-gray-900">Nutrition Facts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Paste a label, parse it into rows, then adjust the structured data manually.
              </p>
            </div>
            <button
              type="button"
              onClick={parseNutrition}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#03c7fe]/20 bg-[#f2fbff] px-4 py-3 text-sm font-bold text-[#03c7fe] transition hover:bg-[#dff6ff]"
            >
              <Wand2 size={16} />
              Parse Nutrition Text
            </button>
          </div>

          <div className="mt-5">
            <label className={labelClass}>Paste Nutrition Label</label>
            <textarea
              className={`${inputClass} min-h-56`}
              value={form.nutritionRawText}
              onChange={(e) => setField("nutritionRawText", e.target.value)}
              placeholder="Paste a supplement facts / nutrition facts label here"
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <div>
              <label className={labelClass}>Table Title</label>
              <input className={inputClass} value={form.servingInfo.title ?? ""} onChange={(e) => setServingInfo({ title: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Serving Size</label>
              <input className={inputClass} value={form.servingInfo.servingSize ?? ""} onChange={(e) => setServingInfo({ servingSize: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Servings Per Container</label>
              <input className={inputClass} value={String(form.servingInfo.servingsPerContainer ?? "")} onChange={(e) => setServingInfo({ servingsPerContainer: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div>
              <label className={labelClass}>Amount Label</label>
              <input className={inputClass} value={form.servingInfo.amountPerServingLabel ?? ""} onChange={(e) => setServingInfo({ amountPerServingLabel: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Daily Value Label</label>
              <input className={inputClass} value={form.servingInfo.dailyValueLabel ?? ""} onChange={(e) => setServingInfo({ dailyValueLabel: e.target.value })} />
            </div>
            <div className="xl:col-span-3">
              <label className={labelClass}>Footnote</label>
              <textarea className={`${inputClass} min-h-24`} value={form.servingInfo.footnote ?? ""} onChange={(e) => setServingInfo({ footnote: e.target.value })} />
            </div>
            <div className="xl:col-span-3">
              <label className={labelClass}>Ingredients Text</label>
              <textarea className={`${inputClass} min-h-24`} value={form.servingInfo.ingredientsText ?? ""} onChange={(e) => setServingInfo({ ingredientsText: e.target.value })} />
            </div>
            <div className="xl:col-span-3">
              <label className={labelClass}>Contains Text</label>
              <textarea className={`${inputClass} min-h-24`} value={form.servingInfo.containsText ?? ""} onChange={(e) => setServingInfo({ containsText: e.target.value })} />
            </div>
            <div className="xl:col-span-3">
              <label className={labelClass}>Notice Text</label>
              <textarea className={`${inputClass} min-h-24`} value={form.servingInfo.noticeText ?? ""} onChange={(e) => setServingInfo({ noticeText: e.target.value })} />
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-gray-100 bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">
                Nutrient Rows
              </h4>
              <button
                type="button"
                onClick={addNutrientRow}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-[#03c7fe] hover:text-[#03c7fe]"
              >
                Add Row
              </button>
            </div>

            <div className="space-y-3">
              {(form.servingInfo.nutrients ?? []).map((row, index) => (
                <div key={`${index}-${row.name ?? ""}`} className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(140px,1fr)_minmax(140px,1fr)_110px_120px_52px]">
                  <input className={inputClass} placeholder="Name" value={row.name ?? ""} onChange={(e) => setNutrientRow(index, { name: e.target.value })} />
                  <input className={inputClass} placeholder="Amount" value={row.amount ?? ""} onChange={(e) => setNutrientRow(index, { amount: e.target.value })} />
                  <input className={inputClass} placeholder="% Daily Value" value={row.dailyValue ?? ""} onChange={(e) => setNutrientRow(index, { dailyValue: e.target.value })} />
                  <input className={inputClass} placeholder="Indent" value={String(row.indentLevel ?? 0)} onChange={(e) => setNutrientRow(index, { indentLevel: Number(e.target.value || 0) })} />
                  <label className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700">
                    <input type="checkbox" checked={Boolean(row.emphasized)} onChange={(e) => setNutrientRow(index, { emphasized: e.target.checked })} />
                    Bold
                  </label>
                  <button
                    type="button"
                    onClick={() => removeNutrientRow(index)}
                    className="inline-flex items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                    title="Remove row"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {!(form.servingInfo.nutrients ?? []).length && (
                <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                  No nutrient rows yet. Paste a label to parse or add rows manually.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
