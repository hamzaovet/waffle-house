"use client";

import React, { useState, useEffect } from "react";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import { Volume2, VolumeX } from "lucide-react";

export default function SoundAlertToggle() {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabled(isSoundEnabled());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
  };

  return (
    <button
      onClick={toggle}
      title={enabled ? "إيقاف الأصوات" : "تشغيل الأصوات"}
      className="fixed bottom-4 left-4 z-50 p-2.5 rounded-2xl bg-[#FFFFFF] border border-[#E8DAC8] text-[#D4954E] hover:bg-[#FAF6EE] hover:border-[#D4954E] transition-all shadow-lg"
    >
      {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
