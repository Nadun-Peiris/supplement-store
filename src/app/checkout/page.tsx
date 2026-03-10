"use client";

import { useCallback, useEffect, useState } from "react";
import "./checkout.css";
import { useCart } from "@/context/CartContext";
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
  const { refreshCart } = useCart();
  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

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

  const [shippingMethod, setShippingMethod] = useState<
    "local_pickup" | "express_3_days"
  >("local_pickup");

  const [purchaseType, setPurchaseType] = useState<
    "one_time" | "subscription"
  >("one_time");

  const [paymentMethod, setPaymentMethod] = useState<
    "bank" | "payhere"
  >("bank");

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
        if (!text) return; // No content returned for this request

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
    form.action = "https://sandbox.payhere.lk/pay/checkout";

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      return_url: `${window.location.origin}/checkout/success?orderId=${order._id}`,
      cancel_url: `${window.location.origin}/checkout`,
      notify_url: `${window.location.origin}/api/payhere/notify`,
      order_id: order._id,
      items: "Supplement Store Order",
      currency: "LKR",
      amount: String(order.total),
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

  const handlePayHerePayment = async () => {
    const orderRes = await fetch("/api/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cartItems,
        subtotal,
        shippingCost,
        total,
        billingDetails: billing,
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok || !orderData?.orderId) {
      throw new Error(orderData?.error || "Failed to create order");
    }

    const hashRes = await fetch("/api/payhere/hash", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: String(orderData.orderId),
        amount: String(orderData.total ?? total),
        currency: "LKR",
      }),
    });

    const hashData = await hashRes.json();

    if (!hashRes.ok || !hashData?.hash) {
      throw new Error(hashData?.error || "Failed to generate PayHere hash");
    }

    const payHereOrder: PayHereOrder = {
      _id: String(orderData.orderId),
      total: Number(orderData.total ?? total),
      billingDetails: orderData.billingDetails ?? billing,
    };

    payWithPayHere(payHereOrder, hashData.hash);
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
        amount: totalAmount,
        currency: "LKR",
      }),
    });

    const { hash } = (await res.json()) as { hash?: string };

    if (!res.ok || !hash) {
      throw new Error("Failed to generate PayHere hash for subscription");
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://sandbox.payhere.lk/pay/checkout";

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      return_url: `${window.location.origin}/checkout/success`,
      cancel_url: `${window.location.origin}/checkout/cancel`,
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

    // ---------------------------
    // ONE-TIME PayHere Payment
    // ---------------------------
    if (purchaseType === "one_time" && paymentMethod === "payhere") {
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

    const orderPayload = {
      items: cartItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      billingDetails: billing,
      shippingMethod,
      purchaseType,
    };

    const headers = {
      "Content-Type": "application/json",
      ...(await getCartHeaders()),
    };

    // Create order first
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers,
      body: JSON.stringify(orderPayload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return alert(data.error);

    const orderId = data.orderId;

    // ---------------------------
    // SUBSCRIPTION PayHere
    // ---------------------------
    if (purchaseType === "subscription") {
      try {
        await redirectToPayHereSubscription(orderId, total);
      } catch (error) {
        console.error("Subscription payment failed:", error);
        alert("Subscription payment failed.");
      }
      return;
    }

    // ---------------------------
    // BANK TRANSFER ONLY
    // ---------------------------
    await fetch("/api/cart", {
      method: "DELETE",
      headers: await getCartHeaders(),
    });

    await refreshCart();

    window.location.href = "/checkout/success?orderId=" + orderId;
  };

  // ---------------------------
  // PRICE CALCULATION
  // ---------------------------
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingCost =
    shippingMethod === "express_3_days" ? 500 : 0;

  const total = subtotal + shippingCost;

  return (
    <div className="checkout-container">
      {/* LEFT SIDE */}
      <div className="checkout-left">
        <h2 className="checkout-title">Billing Details</h2>

        <div className="form-grid">
          <div>
            <label>First name *</label>
            <input
              value={billing.firstName}
              onChange={(e) =>
                updateBilling("firstName", e.target.value)
              }
            />
          </div>

          <div>
            <label>Last name *</label>
            <input
              value={billing.lastName}
              onChange={(e) =>
                updateBilling("lastName", e.target.value)
              }
            />
          </div>
        </div>

        <div className="form-full">
          <label>Email *</label>
          <input
            value={billing.email}
            onChange={(e) =>
              updateBilling("email", e.target.value)
            }
          />
        </div>

        <div className="form-full">
          <label>Phone *</label>
          <input
            value={billing.phone}
            onChange={(e) =>
              updateBilling("phone", e.target.value)
            }
          />
        </div>

        <div className="form-full">
          <label>Street address *</label>
          <input
            placeholder="House number and street"
            value={billing.street}
            onChange={(e) =>
              updateBilling("street", e.target.value)
            }
          />
        </div>

        <div className="form-full">
          <label>Apartment (optional)</label>
          <input
            value={billing.apartment}
            onChange={(e) =>
              updateBilling("apartment", e.target.value)
            }
          />
        </div>

        <div className="form-half">
          <label>City *</label>
          <input
            value={billing.city}
            onChange={(e) =>
              updateBilling("city", e.target.value)
            }
          />
        </div>

        <div className="form-half">
          <label>Postcode *</label>
          <input
            value={billing.postcode}
            onChange={(e) =>
              updateBilling("postcode", e.target.value)
            }
          />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="checkout-right">
        <h2 className="checkout-title">Your Order</h2>

        <div className="order-summary">
          {cartLoading ? (
            <div className="order-skeleton-list">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="order-item skeleton">
                  <div className="order-item-info">
                    <div className="order-item-thumb skeleton-box" />
                    <div className="order-item-text">
                      <div className="skeleton-box line" />
                      <div className="skeleton-box line short" />
                    </div>
                  </div>
                  <div className="skeleton-box price" />
                </div>
              ))}
            </div>
          ) : cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div key={item.productId} className="order-item">
                <div className="order-item-info">
                  <div className="order-item-thumb">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                      />
                    ) : (
                      <span>{getInitial(item.name)}</span>
                    )}
                  </div>
                  <div className="order-item-text">
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-meta">
                      Qty {item.quantity} × LKR {item.price}
                    </span>
                  </div>
                </div>
                <span className="order-item-total">
                  LKR {item.price * item.quantity}
                </span>
              </div>
            ))
          ) : (
            <p className="order-empty">No items in your cart.</p>
          )}

          <div className="summary-line">
            <span>Subtotal</span>
            <span>LKR {subtotal}</span>
          </div>

          <div className="summary-line shipping">
            <span>Shipping</span>
            <div className="shipping-options">
              <label>
                <input
                  type="radio"
                  checked={shippingMethod === "local_pickup"}
                  onChange={() => setShippingMethod("local_pickup")}
                />
                Local Pickup (Free)
              </label>

              <label>
                <input
                  type="radio"
                  checked={
                    shippingMethod === "express_3_days"
                  }
                  onChange={() =>
                    setShippingMethod("express_3_days")
                  }
                />
                Express 3 Days (LKR 500)
              </label>
            </div>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <strong>LKR {total}</strong>
          </div>

          {/* PURCHASE TYPE */}
          <div className="payment-box">
            <h3>Choose Purchase Type</h3>

            <label className="pay-option">
              <input
                type="radio"
                checked={purchaseType === "one_time"}
                onChange={() => {
                  setPurchaseType("one_time");
                  setPaymentMethod("bank");
                }}
              />
              One-Time Purchase
            </label>

            <label className="pay-option">
              <input
                type="radio"
                checked={purchaseType === "subscription"}
                onChange={() => {
                  setPurchaseType("subscription");
                  setPaymentMethod("payhere");
                }}
              />
              Monthly Subscription
            </label>
          </div>

          {/* PAYMENT METHOD */}
          <div className="payment-box">
            <h3>Payment Method</h3>

            {purchaseType === "one_time" && (
              <>
                <label className="pay-option">
                  <input
                    type="radio"
                    checked={paymentMethod === "bank"}
                    onChange={() => setPaymentMethod("bank")}
                  />
                  Direct Bank Transfer
                </label>

                <label className="pay-option">
                  <input
                    type="radio"
                    checked={paymentMethod === "payhere"}
                    onChange={() => setPaymentMethod("payhere")}
                  />
                  Pay by Card (PayHere)
                </label>
              </>
            )}

            {purchaseType === "subscription" && (
              <>
                <label className="pay-option">
                  <input type="radio" checked readOnly />
                  Pay by Card (Subscription)
                </label>
              </>
            )}
          </div>

          {/* TERMS */}
          <label className="terms">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
            />
            I agree to the terms & conditions.
          </label>

          {/* BUTTON */}
          <button
            className="place-order-btn"
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
