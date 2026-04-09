"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

interface CheckoutCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface BillingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  country: string;
  postcode: string;
  apartment?: string;
}

interface PayHereOrder {
  _id: string;
  total: number;
  billingDetails: BillingDetails;
}

interface UserProfileResponse {
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    billingAddress?: Partial<BillingDetails>;
  };
}

export default function CheckoutPage() {
  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";
  const payHereCheckoutUrl =
    process.env.NEXT_PUBLIC_PAYHERE_CHECKOUT_URL ||
    "https://sandbox.payhere.lk/pay/checkout";

  const [billing, setBilling] = useState<BillingDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    country: "Sri Lanka",
    postcode: "",
    apartment: "",
  });

  const [purchaseType, setPurchaseType] = useState<
    "one_time" | "subscription"
  >("one_time");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CheckoutCartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  
  // ---------------------------
  // Load cart + user details
  // ---------------------------
  const getCartHeaders = useCallback(async () => {
    const headers: Record<string, string> = {};
    let guestId = localStorage.getItem("guestId");

    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem("guestId", guestId);
    }

    headers["guest-id"] = guestId;

    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }, []);

  const fetchCartItems = useCallback(async () => {
    try {
      setCartLoading(true);
      const headers = await getCartHeaders();
      const res = await fetch("/api/cart", { headers });

      if (!res.ok) throw new Error("Failed to load cart");

      const data = await res.json();
      setCartItems(data.cart?.items || []);
    } catch (err) {
      console.error("Cart error", err);
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  }, [getCartHeaders]);

  // Load billing for logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error("Failed to load user profile", res.status);
          return;
        }

        const text = await res.text();
        if (!text) return;

        let data: UserProfileResponse;
        try {
          data = JSON.parse(text) as UserProfileResponse;
        } catch (err) {
          console.error("Invalid JSON from /api/user/profile", err);
          return;
        }

        if (data?.user?.billingAddress) {
          const b = data.user.billingAddress;
          setBilling({
            firstName: data.user.firstName || "",
            lastName: data.user.lastName || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            street: b.street || "",
            city: b.city || "",
            country: b.country || "Sri Lanka",
            postcode: b.postcode || "",
            apartment: b.apartment || "",
          });
        }
      }

      fetchCartItems();
    });

    return () => unsubscribe();
  }, [fetchCartItems]);

  // ---------------------------
  // Update billing form
  // ---------------------------
  const updateBilling = (field: keyof BillingDetails, value: string) => {
    setBilling((prev) => ({ ...prev, [field]: value }));
  };

  const payWithPayHere = (order: PayHereOrder, hash: string) => {
    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;

    if (!merchantId) {
      alert("Missing NEXT_PUBLIC_PAYHERE_MERCHANT_ID");
      return;
    }

    const form = document.createElement("form");

    form.method = "POST";
    form.action = payHereCheckoutUrl;

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      return_url: `${window.location.origin}/checkout/success?orderId=${order._id}`,
      cancel_url: `${window.location.origin}/checkout`,
      notify_url: `${window.location.origin}/api/payhere/notify`,
      order_id: order._id,
      items: "Supplement Store Order",
      currency: "LKR",
      amount: Number(order.total).toFixed(2),
      first_name: order.billingDetails.firstName,
      last_name: order.billingDetails.lastName,
      email: order.billingDetails.email,
      phone: order.billingDetails.phone,
      address: order.billingDetails.street,
      city: order.billingDetails.city,
      country: order.billingDetails.country || "Sri Lanka",
      hash,
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const createPayHereOrder = async (): Promise<PayHereOrder> => {
    const cartHeaders = await getCartHeaders();
    const orderRes = await fetch("/api/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...cartHeaders,
      },
      body: JSON.stringify({
        items: cartItems,
        subtotal,
        shippingCost,
        total,
        shippingMethod: "standard_shipping",
        purchaseType,
        billingDetails: billing,
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok || !orderData?.orderId) {
      throw new Error(orderData?.error || "Failed to create order");
    }

    return {
      _id: String(orderData.orderId),
      total: Number(orderData.total ?? total),
      billingDetails: orderData.billingDetails ?? billing,
    };
  };

  const handlePayHerePayment = async () => {
    const order = await createPayHereOrder();

    const hashRes = await fetch("/api/payhere/hash", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: order._id,
        amount: Number(order.total).toFixed(2),
        currency: "LKR",
      }),
    });

    const hashData = await hashRes.json();

    if (!hashRes.ok || !hashData?.hash) {
      throw new Error(hashData?.error || "Failed to generate PayHere hash");
    }

    payWithPayHere(order, hashData.hash);
  };

  async function redirectToPayHereSubscription(
    orderId: string,
    totalAmount: number
  ) {
    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;

    if (!merchantId) {
      throw new Error("Missing NEXT_PUBLIC_PAYHERE_MERCHANT_ID");
    }

    const res = await fetch("/api/payhere/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        amount: totalAmount.toFixed(2),
        currency: "LKR",
      }),
    });

    const { hash } = (await res.json()) as { hash?: string };

    if (!res.ok || !hash) {
      throw new Error("Failed to generate PayHere hash for subscription");
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = payHereCheckoutUrl;

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
      cancel_url: `${window.location.origin}/checkout`,
      notify_url: `${window.location.origin}/api/payhere/notify`,
      order_id: orderId,
      items: "Supplement Subscription",
      currency: "LKR",
      amount: totalAmount.toFixed(2),
      recurrence: "1 Month",
      duration: "Forever",
      first_name: billing.firstName,
      last_name: billing.lastName,
      email: billing.email,
      phone: billing.phone,
      address: billing.street,
      city: billing.city,
      country: "Sri Lanka",
      hash,
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }

  // ---------------------------
  // SUBMIT ORDER
  // ---------------------------
  const placeOrder = async () => {
    if (!agreeTerms) return alert("Please agree to the terms.");
    if (cartItems.length === 0) return alert("Cart empty!");

    setLoading(true);

    if (purchaseType === "one_time") {
      try {
        await handlePayHerePayment();
      } catch (error) {
        console.error("PayHere payment failed:", error);
        alert("Card payment failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (purchaseType === "subscription") {
      try {
        const order = await createPayHereOrder();
        await redirectToPayHereSubscription(order._id, order.total);
      } catch (error) {
        console.error("Subscription payment failed:", error);
        alert("Subscription payment failed.");
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  // ---------------------------
  // PRICE CALCULATION
  // ---------------------------
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingCost = 0;
  const total = subtotal + shippingCost;

  return (
    <div className="w-full bg-white px-6 py-12 md:px-12 lg:px-20 lg:py-16 xl:px-28 2xl:px-40">
      
      {/* HEADER SECTION (Optional, to match cart) */}
      <h1 className="mb-10 text-center text-[2.5rem] font-black tracking-wide text-[#111] md:mb-16 md:text-[3.5rem]">
        CHECKOUT
      </h1>

      {/* FULL WIDTH GRID LAYOUT */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_400px] xl:grid-cols-[1fr_450px] xl:gap-16">
        
        {/* LEFT SIDE: BILLING */}
        <div className="flex flex-col gap-6">
          <h2 className="mb-2 text-2xl font-black text-[#111]">Billing Details</h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">First name *</label>
              <input
                className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition-colors focus:border-[#111] focus:ring-1 focus:ring-[#111]"
                value={billing.firstName}
                onChange={(e) => updateBilling("firstName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Last name *</label>
              <input
                className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition-colors focus:border-[#111] focus:ring-1 focus:ring-[#111]"
                value={billing.lastName}
                onChange={(e) => updateBilling("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Email *</label>
            <input
              className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition-colors focus:border-[#111] focus:ring-1 focus:ring-[#111]"
              value={billing.email}
              onChange={(e) => updateBilling("email", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Phone *</label>
            <input
              className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition-colors focus:border-[#111] focus:ring-1 focus:ring-[#111]"
              value={billing.phone}
              onChange={(e) => updateBilling("phone", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Street address *</label>
            <input
              className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition-colors focus:border-[#111] focus:ring-1 focus:ring-[#111]"
              placeholder="House number and street"
              value={billing.street}
              onChange={(e) => updateBilling("street", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Apartment (optional)</label>
            <input
              className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition-colors focus:border-[#111] focus:ring-1 focus:ring-[#111]"
              value={billing.apartment}
              onChange={(e) => updateBilling("apartment", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">City *</label>
              <input
                className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition-colors focus:border-[#111] focus:ring-1 focus:ring-[#111]"
                value={billing.city}
                onChange={(e) => updateBilling("city", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Postcode *</label>
              <input
                className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition-colors focus:border-[#111] focus:ring-1 focus:ring-[#111]"
                value={billing.postcode}
                onChange={(e) => updateBilling("postcode", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: ORDER SUMMARY */}
        <div className="h-fit w-full rounded-2xl border border-gray-100 bg-white p-7 shadow-sm xl:p-9">
          <h2 className="mb-6 text-xl font-black text-[#111] xl:text-2xl">YOUR ORDER</h2>

          {/* ITEM LIST */}
          <div className="flex flex-col mb-6">
            {cartLoading ? (
              // SKELETONS
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-2">
                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-gray-200" />
                    <div className="flex w-full flex-col gap-2">
                      <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200" />
                      <div className="h-3 w-20 animate-pulse rounded-md bg-gray-200" />
                    </div>
                    <div className="h-4 w-16 animate-pulse rounded-md bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between border-b border-gray-100 py-4 last:border-none">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f8f8f8] text-sm font-bold text-gray-500 uppercase">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover mix-blend-multiply"
                        />
                      ) : (
                        <span>{getInitial(item.name)}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[15px] font-bold text-[#111]">{item.name}</span>
                      <span className="text-[13px] font-medium text-gray-500">
                        Qty {item.quantity} × LKR {item.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[15px] font-bold text-[#111]">
                    LKR {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-gray-500">No items in your cart.</p>
            )}
          </div>

          {/* TOTALS */}
          <div className="mt-2 flex justify-between text-[15px] font-medium text-gray-500">
            <span>Subtotal</span>
            <span className="text-[#111]">LKR {subtotal.toLocaleString()}</span>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5">
            <span className="block mb-3 text-[15px] font-medium text-gray-500">Shipping</span>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between gap-4 text-sm font-medium text-[#111]">
                <span>Standard Shipping</span>
                <span>400</span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex justify-between text-2xl font-black text-[#111]">
              <span>Total</span>
              <span>LKR {total.toLocaleString()}</span>
            </div>
          </div>

          {/* PURCHASE TYPE */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="mb-4 text-lg font-bold text-[#111]">Purchase Type</h3>
            <label className="mb-3 flex cursor-pointer items-center gap-3 text-[15px] text-[#111] font-medium">
              <input
                type="radio"
                className="h-4 w-4 cursor-pointer accent-[#111]"
                checked={purchaseType === "one_time"}
                onChange={() => setPurchaseType("one_time")}
              />
              One-Time Purchase
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-[15px] text-[#111] font-medium">
              <input
                type="radio"
                className="h-4 w-4 cursor-pointer accent-[#111]"
                checked={purchaseType === "subscription"}
                onChange={() => setPurchaseType("subscription")}
              />
              Monthly Subscription
            </label>
          </div>

          {/* PAYMENT METHOD */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="mb-4 text-lg font-bold text-[#111]">Payment Method</h3>
            {purchaseType === "one_time" && (
              <label className="flex cursor-pointer items-center gap-3 text-[15px] text-[#111] font-medium">
                <input type="radio" className="h-4 w-4 accent-[#111]" checked readOnly />
                Pay by Card (PayHere)
              </label>
            )}
            {purchaseType === "subscription" && (
              <label className="flex cursor-pointer items-center gap-3 text-[15px] text-[#111] font-medium">
                <input type="radio" className="h-4 w-4 accent-[#111]" checked readOnly />
                Pay by Card (Subscription)
              </label>
            )}
          </div>

          {/* TERMS */}
          <label className="my-8 flex cursor-pointer items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#111]"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
            />
            I agree to the terms & conditions.
          </label>

          {/* BUTTON */}
          <button
            className="w-full cursor-pointer rounded-full bg-[#111] py-4 text-base font-bold tracking-wide text-white transition-all duration-200 hover:bg-black hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400"
            onClick={placeOrder}
            disabled={loading}
          >
            {loading ? "Processing..." : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
}
