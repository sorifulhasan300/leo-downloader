"use client";

import { useEffect } from "react";
import { getFirebaseAnalytics } from "@/lib/firebase";

export default function FirebaseAnalytics() {
  useEffect(() => {
    // Initialize Firebase Analytics on client mount
    getFirebaseAnalytics();
  }, []);

  return null;
}
