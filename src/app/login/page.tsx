"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Log In</h1>
        <input
          type="email"
          placeholder="Email"
          className={styles.input}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className={styles.passwordInputWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className={styles.input}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className={styles.passwordToggle}
            data-visible={showPassword}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <FaEye
              className={`${styles.passwordToggleIcon} ${styles.passwordToggleIconOpen}`}
              aria-hidden="true"
            />
            <FaEyeSlash
              className={`${styles.passwordToggleIcon} ${styles.passwordToggleIconClosed}`}
              aria-hidden="true"
            />
          </button>
        </div>
        <button onClick={handleLogin} disabled={loading} className={styles.button}>
          {loading ? "Logging in..." : "Log In"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </main>
  );
}
