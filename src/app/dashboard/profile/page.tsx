"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import "./profile.css";
import { auth } from "@/lib/firebase";

interface ProfileForm {
  fullName: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  goal: string;
  activity: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const emptyProfile: ProfileForm = {
    fullName: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    goal: "",
    activity: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
  };

  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);

  async function loadProfile(user: User) {
    try {
      const token = await user.getIdToken();

      const res = await fetch("/api/dashboard/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.user) {
        setProfile({
          fullName: data.user.fullName || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          age: data.user.age ? String(data.user.age) : "",
          gender: data.user.gender || "",

          height: data.user.height ? String(data.user.height) : "",
          weight: data.user.weight ? String(data.user.weight) : "",
          goal: data.user.goal || "",
          activity: data.user.activity || "",

          addressLine1: data.user.addressLine1 || "",
          addressLine2: data.user.addressLine2 || "",
          city: data.user.city || "",
          postalCode: data.user.postalCode || "",
          country: data.user.country || "",
        });
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("You need to be logged in to update your profile.");
        return;
      }

      const token = await currentUser.getIdToken();

      const res = await fetch("/api/dashboard/profile/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (data.success) {
        alert("Profile updated!");
      } else {
        alert("Failed to save profile.");
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) {
        setProfile(emptyProfile);
        setLoading(false);
        return;
      }
      loadProfile(firebaseUser);
    });

    return () => unsub();
  }, []);

  if (loading) return <div className="profile-loading">Loading...</div>;

  return (
    <div className="profile-container">
      <h2 className="profile-title">Your Profile</h2>

      {/* PERSONAL INFORMATION */}
      <div className="profile-card">
        <h3 className="section-title">Personal Information</h3>

        <div className="two-column">
          <div className="input-group">
            <label>Full Name</label>
            <input
              value={profile.fullName}
              onChange={(e) =>
                setProfile({ ...profile, fullName: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label>Email (read-only)</label>
            <input value={profile.email} readOnly />
          </div>

          <div className="input-group">
            <label>Phone</label>
            <input
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label>Age</label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) =>
                setProfile({ ...profile, age: e.target.value })
              }
            />
          </div>

          <div className="input-group full">
            <label>Gender</label>
            <select
              value={profile.gender}
              onChange={(e) =>
                setProfile({ ...profile, gender: e.target.value })
              }
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* HEALTH INFORMATION */}
      <div className="profile-card">
        <h3 className="section-title">Health Information</h3>

        <div className="two-column">
          <div className="input-group">
            <label>Height (cm)</label>
            <input
              type="number"
              value={profile.height}
              onChange={(e) =>
                setProfile({ ...profile, height: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              value={profile.weight}
              onChange={(e) =>
                setProfile({ ...profile, weight: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label>Goal</label>
            <select
              value={profile.goal}
              onChange={(e) =>
                setProfile({ ...profile, goal: e.target.value })
              }
            >
              <option value="">Select</option>
              <option>Weight Loss</option>
              <option>Muscle Gain</option>
              <option>Maintenance</option>
            </select>
          </div>

          <div className="input-group">
            <label>Activity Level</label>
            <select
              value={profile.activity}
              onChange={(e) =>
                setProfile({ ...profile, activity: e.target.value })
              }
            >
              <option value="">Select</option>
              <option>Sedentary</option>
              <option>Light</option>
              <option>Moderate</option>
              <option>Active</option>
              <option>Very Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* BILLING INFORMATION */}
      <div className="profile-card">
        <h3 className="section-title">Billing Address</h3>

        <div className="two-column">
          <div className="input-group full">
            <label>Address Line 1</label>
            <input
              value={profile.addressLine1}
              onChange={(e) =>
                setProfile({ ...profile, addressLine1: e.target.value })
              }
            />
          </div>

          <div className="input-group full">
            <label>Address Line 2</label>
            <input
              value={profile.addressLine2}
              onChange={(e) =>
                setProfile({ ...profile, addressLine2: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label>City</label>
            <input
              value={profile.city}
              onChange={(e) =>
                setProfile({ ...profile, city: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label>Postal Code</label>
            <input
              value={profile.postalCode}
              onChange={(e) =>
                setProfile({ ...profile, postalCode: e.target.value })
              }
            />
          </div>

          <div className="input-group full">
            <label>Country</label>
            <input
              value={profile.country}
              onChange={(e) =>
                setProfile({ ...profile, country: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <button className="save-btn" onClick={saveProfile} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
