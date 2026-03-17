"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Package, CheckCircle, XCircle, Clock, ArrowLeft, Truck } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
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

interface Order {
  _id: string;
  createdAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  trackingNumber?: string;
  orderType: string;
  subscriptionId?: string | null;
  total: number;
  shippingMethod: string;
  paymentProvider: string;
  billingDetails: BillingDetails;
  items: OrderItem[];
  nextBillingDate?: string;
}

const LoadingSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8">
      {/* HERO SKELETON */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-[#d9f6ff] bg-white p-5">
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-[140px] animate-pulse rounded-full bg-gray-100" />
          <div className="h-6 w-[240px] animate-pulse rounded-full bg-gray-100" />
          <div className="h-3 w-[200px] animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-[130px] animate-pulse rounded-full bg-gray-100" />
          <div className="h-8 w-[100px] animate-pulse rounded-full bg-gray-100" />
          <div className="h-8 w-[100px] animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>

      {/* CARD SKELETON */}
      <div className="rounded-2xl border border-[#e8ecf2] bg-white p-5">
        <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-[1.4fr_1fr]">
          
          {/* LEFT BLOCK */}
          <div className="flex flex-col gap-4 rounded-xl border border-transparent p-4">
            <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-4">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-gray-100" />
              <div className="flex flex-col gap-2">
                <div className="h-2.5 w-[90px] animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 w-[140px] animate-pulse rounded-full bg-gray-100" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-2.5 w-[90px] animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 w-[140px] animate-pulse rounded-full bg-gray-100" />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-[140px] animate-pulse rounded-full bg-gray-100" />
                <div className="h-6 w-[80px] animate-pulse rounded-full bg-gray-100" />
              </div>
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <div className="flex flex-col gap-2">
                    <div className="h-3 w-[140px] animate-pulse rounded-full bg-gray-100" />
                    <div className="h-2.5 w-[80px] animate-pulse rounded-full bg-gray-100" />
                  </div>
                  <div className="h-3 w-[80px] animate-pulse rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT BLOCK */}
          <div className="flex flex-col gap-6 rounded-xl border border-[#e8ecf2] p-4">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="h-2.5 w-[90px] animate-pulse rounded-full bg-gray-100" />
                  <div className="h-3 w-[140px] animate-pulse rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="h-2.5 w-[90px] animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 w-[140px] animate-pulse rounded-full bg-gray-100" />
                <div className="h-2.5 w-[100px] animate-pulse rounded-full bg-gray-100" />
              </div>
              <div className="flex flex-col gap-2 min-[900px]:text-right text-left">
                <div className="h-2.5 w-[90px] animate-pulse rounded-full bg-gray-100 min-[900px]:ml-auto" />
                <div className="h-3 w-full max-w-[200px] animate-pulse rounded-full bg-gray-100 min-[900px]:ml-auto" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const formatLabel = (value?: string) => {
    if (!value) return "--";
    return value
      .toString()
      .replace(/[-_]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    const id = Array.isArray(orderId) ? orderId[0] : orderId;
    if (!id) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setOrder(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await user.getIdToken();

        const res = await fetch(`/api/dashboard/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setOrder(null);
        } else {
          const data = await res.json();
          setOrder(data.order || null);
        }
      } catch (err) {
        console.error("Order detail error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  // Dynamic Payment Badge
  const renderPaymentStatus = () => {
    if (!order) return null;
    
    let config = { bg: "bg-[#fff6d6]", text: "text-[#d4a800]", border: "border-[#f1c40f]/20", icon: Clock, label: "Pending" };
    
    if (order.paymentStatus === "paid") {
      config = { bg: "bg-[#e8f9ef]", text: "text-[#2ecc71]", border: "border-[#2ecc71]/20", icon: CheckCircle, label: "Paid" };
    } else if (order.paymentStatus === "failed") {
      config = { bg: "bg-[#ffe6e6]", text: "text-[#e74c3c]", border: "border-[#e74c3c]/20", icon: XCircle, label: "Failed" };
    }

    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide ${config.bg} ${config.text} ${config.border}`}>
        <Icon size={14} />
        {config.label}
      </div>
    );
  };

  // Dynamic Fulfillment Badge
  const renderFulfillmentStatus = () => {
    if (!order) return null;
    const status = order.fulfillmentStatus || "unfulfilled";
    
    let config = { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: Package, label: formatLabel(status) };

    if (status === "completed" || status === "delivered") {
      config = { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: CheckCircle, label: formatLabel(status) };
    } else if (status === "shipped") {
      config = { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: Truck, label: "Shipped" };
    }

    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide ${config.bg} ${config.text} ${config.border}`}>
        <Icon size={14} />
        {config.label}
      </div>
    );
  };

  if (loading) return <LoadingSkeleton />;
  if (!order) return <p className="mt-10 text-center text-base text-gray-500">Order not found.</p>;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8">

      {/* BACK BUTTON */}
      <button 
        className="inline-flex items-center self-start gap-1.5 rounded-[10px] border border-[#d9f6ff] bg-[#f0fbff] px-3 py-2 text-sm font-semibold text-[#0f172a] transition-all duration-200 hover:border-[#00c7fc] hover:shadow-[0_6px_14px_rgba(0,199,252,0.16)]"
        onClick={() => window.history.back()}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* HERO SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9f6ff] bg-[linear-gradient(135deg,#f5fcff_0%,#eaf9ff_100%)] p-5 px-6">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f89a1]">
            Order #{order._id.slice(-6)}
          </p>
          <h1 className="text-[26px] font-bold text-[#0f172a]">Order Details</h1>
          <p className="mt-1 text-sm text-[#5a6a80]">
            Placed on {new Date(order.createdAt).toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {order.orderType === "subscription" && order.subscriptionId && (
            <p className="mt-2 text-sm font-semibold text-[#00a9d9]">
              Subscription ID: {order.subscriptionId}
            </p>
          )}
        </div>
        
        {/* BADGES */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#e7ecf7] px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-[#4a6070]">
            {formatLabel(order.orderType)}
          </span>
          {renderPaymentStatus()}
          {renderFulfillmentStatus()}
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="rounded-2xl border border-[#d9f6ff] bg-white p-5 shadow-[0_10px_30px_rgba(9,30,66,0.04)]">
        <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-[1.4fr_1fr]">
          
          {/* LEFT BLOCK (Items & Totals) */}
          <div className="flex flex-col gap-3 rounded-[14px] border border-[#d9f6ff] bg-[#f9feff] p-4">
            
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-3">
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#e6faff] text-[#00c7fc]">
                <Package size={20} />
              </div>
              <div>
                <p className="mb-1 text-xs text-[#6e7c90]">Shipping Method</p>
                <p className="font-bold text-[#0f172a]">{formatLabel(order.shippingMethod || "standard_shipping")}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-[#6e7c90]">Payment Method</p>
                <p className="font-bold text-[#0f172a]">{formatLabel(order.paymentProvider)}</p>
              </div>
            </div>

            {/* Item List */}
            <div className="mt-2">
              <div className="mb-2.5 flex items-center justify-between">
                <h4 className="text-base font-bold text-[#0f172a]">Items</h4>
                <span className="inline-flex rounded-full bg-[#00c7fc]/10 px-3 py-1.5 text-xs font-semibold text-[#00c7fc]">
                  {order.items.length} items
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-[#e9eff7] bg-white px-3 py-2.5">
                    <div>
                      <p className="font-semibold text-[#0f172a]">{item.name}</p>
                      <p className="text-[13px] text-[#6e7c90]">Qty: {item.quantity}</p>
                    </div>
                    <strong className="text-[#0f172a]">
                      LKR {(item.price * item.quantity).toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Row */}
            <div className="mt-2 grid grid-cols-2 items-center gap-3">
              <div>
                <p className="mb-1 text-xs text-[#6e7c90]">Order Type</p>
                <p className="font-bold text-[#0f172a]">{formatLabel(order.orderType)}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-[#6e7c90]">Total</p>
                <p className="text-[22px] font-extrabold text-[#00c7fc]">
                  LKR {order.total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT BLOCK (Details) */}
          <div className="flex flex-col gap-4 rounded-[14px] border border-[#d9f6ff] bg-white p-4">
            
            {/* Status Grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
              <div>
                <p className="mb-1 text-xs text-[#6e7c90]">Payment Status</p>
                <div className="mt-0.5">
                  {renderPaymentStatus()}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-[#6e7c90]">Fulfillment Status</p>
                <div className="mt-0.5">
                  {renderFulfillmentStatus()}
                </div>
              </div>

              {/* WAYBILL / TRACKING NUMBER DISPLAY */}
              {order.trackingNumber && (
                <div>
                  <p className="mb-1 text-xs text-[#6e7c90]">Waybill / Tracking No.</p>
                  <p className="break-all font-mono text-xs font-bold text-[#00c7fc]">
                    {order.trackingNumber}
                  </p>
                </div>
              )}

              {order.orderType === "subscription" && order.nextBillingDate && (
                <div>
                  <p className="mb-1 text-xs text-[#6e7c90]">Next Billing</p>
                  <p className="font-bold text-[#0f172a]">
                    {new Date(order.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <p className="mb-1 text-xs text-[#6e7c90]">Order ID</p>
                <p className="break-all font-mono text-xs font-medium text-[#4a6070]">
                  {order._id}
                </p>
              </div>

              {order.orderType === "subscription" && order.subscriptionId && (
                <div>
                  <p className="mb-1 text-xs text-[#6e7c90]">Subscription ID</p>
                  <p className="break-all font-mono text-xs font-medium text-[#00c7fc]">
                    {order.subscriptionId}
                  </p>
                </div>
              )}
            </div>

            {/* Billing Row */}
            <div className="mt-2 grid grid-cols-1 items-start gap-4 rounded-xl border border-[#e9eff7] p-3 min-[900px]:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-[#6e7c90]">Billing Contact</p>
                <p className="font-bold text-[#0f172a]">
                  {order.billingDetails.firstName} {order.billingDetails.lastName}
                </p>
                <p className="text-[13px] text-[#6e7c90]">{order.billingDetails.email}</p>
                <p className="text-[13px] text-[#6e7c90]">{order.billingDetails.phone}</p>
              </div>
              <div className="text-left min-[900px]:text-right">
                <p className="mb-1 text-xs text-[#6e7c90]">Address</p>
                <p className="text-[13px] text-[#6e7c90]">
                  {order.billingDetails.street}
                  <br />
                  {order.billingDetails.city}, {order.billingDetails.country}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
