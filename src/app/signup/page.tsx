"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      // 2️⃣ Save user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        createdAt: serverTimestamp(),
        isAdmin: false,
      });

      // 3️⃣ Redirect to login
      router.push("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <form onSubmit={handleSignup} className={styles.form}>
        <h1 className={styles.title}>Create Account</h1>

        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.signupBtn}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className={styles.redirect}>
          Already have an account?{" "}
          <a href="/login" className={styles.link}>
            Log In
          </a>
        </p>
      </form>
    </main>
  );
}
