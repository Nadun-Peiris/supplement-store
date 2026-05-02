"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import { User as UserIcon, Activity, MapPin, Save, Loader2 } from "lucide-react";

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

const EMPTY_PROFILE: ProfileForm = {
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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);

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
        toast.error("You must be logged in.");
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
        toast.success("Profile updated!");
      } else {
        toast.error("Failed to save profile.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) {
        setProfile(EMPTY_PROFILE);
        setLoading(false);
        return;
      }
      loadProfile(firebaseUser);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#03c7fe]" />
        <p className="text-sm font-medium text-gray-400">Loading profile...</p>
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-gray-200 bg-white p-3 text-[14px] outline-none transition-all focus:border-[#03c7fe] focus:ring-1 focus:ring-[#03c7fe]";
  const labelClass = "text-[13px] font-bold text-gray-500 mb-1.5 flex items-center gap-2";

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8">
      <h2 className="text-3xl font-black tracking-tight text-[#111]">Your Profile</h2>

      {/* PERSONAL INFORMATION */}
      <section className="rounded-2xl border border-gray-100 bg-[#f8f8f8] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
          <UserIcon className="text-[#03c7fe]" size={20} />
          <h3 className="text-lg font-bold text-[#111]">Personal Information</h3>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col">
            <label className={labelClass}>Full Name</label>
            <input
              className={inputClass}
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Email (read-only)</label>
            <input className={`${inputClass} bg-gray-100 text-gray-400 cursor-not-allowed`} value={profile.email} readOnly />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Phone</label>
            <input
              className={inputClass}
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Age</label>
            <input
              type="number"
              className={inputClass}
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className={labelClass}>Gender</label>
            <select
              className={inputClass}
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </section>

      {/* HEALTH INFORMATION */}
      <section className="rounded-2xl border border-gray-100 bg-[#f8f8f8] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
          <Activity className="text-[#03c7fe]" size={20} />
          <h3 className="text-lg font-bold text-[#111]">Health Information</h3>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col">
            <label className={labelClass}>Height (cm)</label>
            <input
              type="number"
              className={inputClass}
              value={profile.height}
              onChange={(e) => setProfile({ ...profile, height: e.target.value })}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Weight (kg)</label>
            <input
              type="number"
              className={inputClass}
              value={profile.weight}
              onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Goal</label>
            <select
              className={inputClass}
              value={profile.goal}
              onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
            >
              <option value="">Select</option>
              <option>Weight Loss</option>
              <option>Muscle Gain</option>
              <option>Maintenance</option>
              <option>Body Transformation</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Activity Level</label>
            <select
              className={inputClass}
              value={profile.activity}
              onChange={(e) => setProfile({ ...profile, activity: e.target.value })}
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
      </section>

      {/* BILLING INFORMATION */}
      <section className="rounded-2xl border border-gray-100 bg-[#f8f8f8] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
          <MapPin className="text-[#03c7fe]" size={20} />
          <h3 className="text-lg font-bold text-[#111]">Billing Address</h3>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col md:col-span-2">
            <label className={labelClass}>Address Line 1</label>
            <input
              className={inputClass}
              value={profile.addressLine1}
              onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })}
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className={labelClass}>Address Line 2</label>
            <input
              className={inputClass}
              value={profile.addressLine2}
              onChange={(e) => setProfile({ ...profile, addressLine2: e.target.value })}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>City</label>
            <input
              className={inputClass}
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Postal Code</label>
            <input
              className={inputClass}
              value={profile.postalCode}
              onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className={labelClass}>Country</label>
            <input
              className={inputClass}
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* SAVE BUTTON */}
      <button
        className="flex items-center justify-center gap-2 rounded-xl bg-[#03c7fe] px-8 py-4 font-bold text-white transition-all hover:bg-[#02a8d9] hover:shadow-lg active:scale-95 disabled:opacity-50 md:w-fit"
        onClick={saveProfile}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Save size={20} />
        )}
        {saving ? "Saving Changes..." : "Save Changes"}
      </button>
    </div>
  );
}
