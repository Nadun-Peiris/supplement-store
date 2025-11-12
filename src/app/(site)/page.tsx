"use client";

import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading)
    return (
      <main className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );

  return (
    <main className="flex flex-col h-screen items-center justify-center bg-gray-50">
      {user ? (
        <>
          <h1 className="text-3xl font-bold mb-4">
            Welcome, {user.email} 👋
          </h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Log Out
          </button>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-4">Welcome to the Store</h1>
          <a
            href="/login"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Log In
          </a>
        </>
      )}
    </main>
  );
}
