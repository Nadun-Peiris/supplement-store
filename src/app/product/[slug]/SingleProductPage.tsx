"use client";

import Image from "next/image";
import toast from "react-hot-toast";
import { useState } from "react";
import ProductCarousel from "@/components/ProductCarousel";
import FeaturesSection from "@/components/FeaturesSection";
import { useCart } from "@/context/CartContext";
import type { ProductDTO } from "@/types/product";
import { ChevronRight, Minus, Plus, ShieldCheck, CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BUY_NOW_STORAGE_KEY = "checkout-buy-now-item";

export default function SingleProductPage({ product }: { product: ProductDTO }) {
  const servingInfo = product.details?.servingInfo;
  const hasSupplementFacts = Boolean(
    servingInfo?.nutrients?.length ||
      servingInfo?.servingSize ||
      typeof servingInfo?.servingsPerContainer === "number" ||
      servingInfo?.footnote ||
      servingInfo?.ingredientsText ||
      servingInfo?.containsText ||
      servingInfo?.noticeText
  );
  const defaultTab = hasSupplementFacts ? "facts" : "overview";
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const imageSources = [product.image, ...(product.gallery ?? [])].filter(
    (image, index, images): image is string => Boolean(image) && images.indexOf(image) === index
  );
  const [selectedImage, setSelectedImage] = useState(imageSources[0] ?? "/placeholder.png");

  const stock = Math.max(product.stock ?? 0, 0);
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock < 4;

  const brandName = product.brandName?.trim() || "Unbranded";
  const brandSlug = product.brandSlug?.trim() || "";
  const categoryName = product.category?.trim() || "Category";
  const categorySlug = product.categorySlug?.trim() || "";
  const hasKnownBrand = !["", "unknown", "unbranded", "n-a", "na"].includes(brandSlug.toLowerCase());
  const displayPrice = product.discountPrice ?? product.price;
  const hasDiscount = typeof product.discountPrice === "number" && product.discountPrice < product.price;
  const currency = product.currency || "LKR";

  const { addToCart } = useCart();
  const router = useRouter();

  const increaseQty = () => setQty((q) => (stock > 0 ? Math.min(q + 1, stock) : 1));
  const decreaseQty = () => setQty((q) => (q > 1 ? q - 1 : 1));

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    await addToCart({
      productId: product._id,
      name: product.name,
      price: displayPrice,
      image: product.image,
      quantity: qty,
    });
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    const buyNowItem = {
      productId: product._id,
      name: product.name,
      price: displayPrice,
      originalPrice: hasDiscount ? product.price : undefined,
      quantity: qty,
      image: product.image,
    };

    sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(buyNowItem));
    router.push("/checkout?mode=buy-now");
  };

  // Check what data we actually have to selectively render tabs
  const hasDetails =
    !!product.details?.overview ||
    !!product.details?.benefits?.length ||
    !!product.details?.howToUse?.length ||
    !!product.details?.additionalInfo?.length;
  const hasIngredients = !!product.details?.ingredients?.length || !!product.details?.warnings?.length;
  const hasAuthenticity = product.coa?.verified || !!product.coa?.certificateUrl;
  const tabs = [
    hasDetails ? "overview" : null,
    hasSupplementFacts ? "facts" : null,
    hasIngredients ? "ingredients" : null,
    hasAuthenticity ? "authenticity" : null,
  ].filter((tab): tab is string => Boolean(tab));
  const currentActiveTab = tabs.includes(activeTab) ? activeTab : (tabs[0] ?? "overview");

  return (
    <>
      <div className="mx-auto max-w-[1700px] px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
        
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center text-sm font-medium text-gray-500">
          <Link href="/" className="hover:text-[#03C7FE] transition-colors">Home</Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <Link href={categorySlug ? `/shop/${categorySlug}` : "/shop"} className="hover:text-[#03C7FE] transition-colors">{categoryName}</Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="text-gray-900 truncate">{product.name}</span>
        </nav>

        {/* 3-Column Grid Layout (Image | Divider | Info) */}
        <div className="grid grid-cols-1 items-start gap-y-10 lg:grid-cols-[1.15fr_1px_1fr] lg:gap-x-12 xl:gap-x-16">
          
          {/* LEFT: Image Box */}
          <div className="space-y-4">
            <div className="relative flex aspect-square w-full items-center justify-center rounded-[24px] border border-gray-200 bg-white p-8 shadow-sm lg:h-[720px] lg:p-12">
              <Image
                src={selectedImage}
                width={800}
                height={800}
                alt={product.name}
                className="h-full w-full object-contain mix-blend-multiply drop-shadow-xl transition-transform duration-500 hover:scale-105"
                priority
              />
            </div>
            {imageSources.length > 1 && (
              <div className="flex flex-wrap gap-3">
                {imageSources.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`relative h-20 w-20 overflow-hidden rounded-2xl border bg-white p-2 transition ${
                      selectedImage === image ? "border-black shadow-sm" : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Image
                      src={image}
                      width={80}
                      height={80}
                      alt={`${product.name} view ${index + 1}`}
                      className="h-full w-full object-contain mix-blend-multiply"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* MIDDLE: Vertical Divider */}
          <div className="hidden h-full w-full rounded-full bg-gray-200 lg:block" />

          {/* RIGHT: Content Info */}
          <div className="flex flex-col pt-2">
            
            <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl leading-[1.1]">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600 sm:text-base">
              {hasKnownBrand ? (
                <Link href={`/shop/brand/${encodeURIComponent(brandSlug)}`} className="inline-flex items-center gap-1">
                  <span className="font-bold text-gray-900">Brand:</span>
                  <span className="text-[#03C7FE] hover:text-[#03a9d9] hover:underline transition-colors">{brandName}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <span className="font-bold text-gray-900">Brand:</span>
                  <span>{brandName}</span>
                </span>
              )}
              <span className="text-gray-300">|</span>
              <Link href={categorySlug ? `/shop/${encodeURIComponent(categorySlug)}` : "/shop"} className="inline-flex items-center gap-1">
                <span className="font-bold text-gray-900">Category:</span>
                <span className="text-[#03C7FE] hover:text-[#03a9d9] hover:underline transition-colors">{categoryName}</span>
              </Link>
            </div>

            <div className="mt-6 flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-4xl font-extrabold text-gray-900">
                  {currency} {displayPrice.toLocaleString()}
                </p>
                {hasDiscount && (
                  <p className="pb-1 text-lg font-semibold text-gray-400 line-through">
                    {currency} {product.price.toLocaleString()}
                  </p>
                )}
              </div>
              <div className={`inline-flex items-center rounded-full px-3 py-1 mb-1.5 text-xs font-bold uppercase tracking-wide ${isOutOfStock ? "bg-red-100 text-red-700" : isLowStock ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                {isOutOfStock ? "Out of stock" : isLowStock ? `Low stock (${stock} left)` : "In stock"}
              </div>
            </div>

            <p className="mt-6 text-base leading-relaxed text-gray-600 lg:max-w-[90%]">
              {product.details?.overview || product.description || "No product description available yet."}
            </p>

            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Quantity</span>
              <div className="flex h-12 w-32 items-center justify-between rounded-full bg-gray-100 px-4 border border-gray-200">
                <button type="button" onClick={decreaseQty} className="text-gray-500 transition-colors hover:text-[#03C7FE] disabled:opacity-50" disabled={qty <= 1}>
                  <Minus size={18} />
                </button>
                <span className="text-base font-bold text-gray-900">{qty}</span>
                <button type="button" onClick={increaseQty} className="text-gray-500 transition-colors hover:text-[#03C7FE] disabled:opacity-50" disabled={isOutOfStock || qty >= stock}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button onClick={handleAddToCart} disabled={isOutOfStock} className="flex h-14 w-full items-center justify-center rounded-full border-2 border-black bg-black text-sm font-bold tracking-wide text-white transition-all duration-300 hover:border-[#03C7FE] hover:bg-gray-900 disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed">
                ADD TO CART
              </button>
              <button onClick={handleBuyNow} disabled={isOutOfStock} className="flex h-14 w-full items-center justify-center rounded-full border-2 border-gray-900 bg-white text-sm font-bold tracking-wide text-gray-900 transition-all duration-300 hover:border-[#03C7FE] hover:bg-gray-900 hover:text-white disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                BUY IT NOW
              </button>
            </div>

            <div className="mt-10 rounded-2xl bg-gray-50 p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="text-green-600 h-5 w-5" />
                <p className="text-sm font-bold text-gray-900">Guarantee Safe & Secure Checkout</p>
              </div>
              <Image src="/payment.png" width={400} height={60} alt="Accepted Payment Methods" className="h-auto w-full max-w-[350px] object-contain opacity-80 mix-blend-multiply" />
            </div>

          </div>
        </div>

        {/* ========================================= */}
        {/* NEW SECTION: TABS FOR STRUCTURED DATA */}
        {/* ========================================= */}
        {(hasDetails || hasSupplementFacts || hasIngredients || hasAuthenticity) && (
          <div className="mt-20 border-t border-gray-200 pt-10">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-8 border-b border-gray-200">
              {hasDetails && (
                <button 
                  onClick={() => setActiveTab("overview")}
                  className={`pb-4 text-sm font-bold tracking-wider uppercase transition-colors ${currentActiveTab === "overview" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"}`}
                >
                  Overview
                </button>
              )}
              {hasSupplementFacts && (
                <button 
                  onClick={() => setActiveTab("facts")}
                  className={`pb-4 text-sm font-bold tracking-wider uppercase transition-colors ${currentActiveTab === "facts" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"}`}
                >
                  Supplement Facts
                </button>
              )}
              {hasIngredients && (
                <button 
                  onClick={() => setActiveTab("ingredients")}
                  className={`pb-4 text-sm font-bold tracking-wider uppercase transition-colors ${currentActiveTab === "ingredients" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"}`}
                >
                  Ingredients & Warnings
                </button>
              )}
              {hasAuthenticity && (
                <button 
                  onClick={() => setActiveTab("authenticity")}
                  className={`pb-4 text-sm font-bold tracking-wider uppercase transition-colors ${currentActiveTab === "authenticity" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"}`}
                >
                  Authenticity
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="py-8 lg:w-2/3">
              
              {/* Overview Tab */}
              {currentActiveTab === "overview" && hasDetails && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {product.details?.overview && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Product Overview</h3>
                      <p className="text-gray-600 leading-relaxed">{product.details.overview}</p>
                    </div>
                  )}
                  {product.details?.benefits && product.details.benefits.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Key Benefits</h3>
                      <ul className="list-disc pl-5 space-y-2 text-gray-600 marker:text-[#03C7FE]">
                        {product.details.benefits.map((benefit, i) => (
                          <li key={i}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {product.details?.howToUse && product.details.howToUse.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">How To Use</h3>
                      <ul className="space-y-3 text-gray-600">
                        {product.details.howToUse.map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-900">{i + 1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {product.details?.additionalInfo && product.details.additionalInfo.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Additional Information</h3>
                      <ul className="list-disc pl-5 space-y-2 text-gray-600 marker:text-[#03C7FE]">
                        {product.details.additionalInfo.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Supplement Facts Tab */}
              {currentActiveTab === "facts" && hasSupplementFacts && (
                <div className="animate-in fade-in duration-500 max-w-md">
                  <div className="border-[3px] border-black bg-white p-4">
                    <h3 className="text-3xl font-black text-black tracking-tighter mb-1">
                      {servingInfo?.title || "Supplement Facts"}
                    </h3>
                    
                    {servingInfo?.servingSize && (
                      <p className="text-sm font-bold border-b-[5px] border-black pb-2">
                        Serving Size: {servingInfo.servingSize}
                        {servingInfo?.servingsPerContainer && (
                          <span className="block font-normal">Servings Per Container: {servingInfo.servingsPerContainer}</span>
                        )}
                      </p>
                    )}

                    <div className="flex justify-between items-end border-b border-black py-1">
                      <span className="text-xs font-bold uppercase">
                        {servingInfo?.amountPerServingLabel || "Amount Per Serving"}
                      </span>
                      <span className="text-xs font-bold uppercase">
                        {servingInfo?.dailyValueLabel || "% Daily Value"}
                      </span>
                    </div>

                    <div className="flex flex-col border-b-[5px] border-black">
                      {servingInfo?.nutrients?.map((nutrient, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-gray-300 py-1.5 last:border-none">
                          <span
                            className={`text-sm ${nutrient.emphasized ? "font-bold" : "font-medium"}`}
                            style={{ paddingLeft: `${(nutrient.indentLevel ?? 0) * 16}px` }}
                          >
                            {nutrient.name}{" "}
                            {nutrient.amount ? (
                              <span className="font-normal pl-1">{nutrient.amount}</span>
                            ) : null}
                          </span>
                          <span className="text-sm font-bold">{nutrient.dailyValue || "-"}</span>
                        </div>
                      ))}
                    </div>
                    
                    {servingInfo?.footnote && (
                      <p className="text-xs text-gray-500 mt-2 leading-tight">
                        {servingInfo.footnote}
                      </p>
                    )}

                    {(servingInfo?.ingredientsText || servingInfo?.containsText || servingInfo?.noticeText) && (
                      <div className="mt-4 space-y-2 border-t border-gray-200 pt-3 text-xs leading-relaxed text-gray-700">
                        {servingInfo.ingredientsText && (
                          <p><span className="font-bold">Ingredients:</span> {servingInfo.ingredientsText}</p>
                        )}
                        {servingInfo.containsText && (
                          <p><span className="font-bold">Contains:</span> {servingInfo.containsText}</p>
                        )}
                        {servingInfo.noticeText && (
                          <p><span className="font-bold">Notice:</span> {servingInfo.noticeText}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ingredients & Warnings Tab */}
              {currentActiveTab === "ingredients" && hasIngredients && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {product.details?.ingredients && product.details.ingredients.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Ingredients</h3>
                      <p className="text-gray-600 leading-relaxed uppercase text-sm font-medium">
                        {product.details.ingredients.join(", ")}
                      </p>
                    </div>
                  )}
                  {product.details?.warnings && product.details.warnings.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                      <h3 className="text-lg font-bold text-red-900 mb-2">Warnings & Allergen Info</h3>
                      <ul className="list-disc pl-5 space-y-1 text-red-800 text-sm">
                        {product.details.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Authenticity Tab */}
              {currentActiveTab === "authenticity" && hasAuthenticity && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {product.coa?.verified && (
                    <div className="flex items-start gap-4 rounded-xl bg-green-50 p-5 border border-green-100">
                      <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-green-900 text-lg">Verified Authentic</h3>
                        <p className="text-green-800 text-sm mt-1">This product has been independently tested and verified for purity, quality, and ingredient accuracy.</p>
                      </div>
                    </div>
                  )}

                  {product.coa?.certificateUrl && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <a 
                        href={product.coa.certificateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#03C7FE] font-bold hover:underline"
                      >
                        View Certificate of Analysis (COA) PDF
                      </a>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      <ProductCarousel category={product.category} />
      <FeaturesSection />
    </>
  );
}
