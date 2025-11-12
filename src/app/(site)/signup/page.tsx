"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 1️⃣ Create user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // 2️⃣ Create Firestore record automatically
      await setDoc(doc(db, "users", userCred.user.uid), {
        name,
        email,
        phone,
        isAdmin: false,
        role: "user",
        createdAt: serverTimestamp(),
      });

      // 3️⃣ Redirect or confirm
      alert("Account created successfully!");
      router.push("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Signup failed. Please try again.");
    }
  };

  return (
    <main className="flex items-center justify-center h-screen">
      <form
        onSubmit={handleSignup}
        className="flex flex-col bg-white shadow-md rounded-lg p-6 w-[360px] space-y-3"
      >
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
        >
          Sign Up
        </button>
      </form>
    </main>
  );
}
