"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <main className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            Secure Checkout
          </h1>
          <p className="text-gray-600">
            Only logged-in users can see this page.
          </p>
        </div>
      </main>
    </ProtectedRoute>
  );
}
