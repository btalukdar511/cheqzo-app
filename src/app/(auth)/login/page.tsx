"use client";

import { BadgeCheck, Images, IndianRupee, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OtpStep } from "@/app/(auth)/login/otp-step";
import { PhoneStep } from "@/app/(auth)/login/phone-step";
import { SeedImage } from "@/components/shared/SeedImage";
import { Wordmark } from "@/components/shell/Wordmark";
import { useSession } from "@/store/session";

const POINTS: { icon: LucideIcon; text: string }[] = [
  { icon: IndianRupee, text: "Budget, paid, and remaining in one view" },
  { icon: BadgeCheck, text: "Nothing counts until you approve it" },
  { icon: Images, text: "Every room, with the photos to prove it" },
];

export default function LoginPage() {
  const reduce = useReducedMotion() === true;
  const [phone, setPhone] = useState<string | null>(null);
  const setSessionPhone = useSession((state) => state.setPhone);
  const router = useRouter();
  const transition = reduce ? { duration: 0 } : { duration: 0.2 };

  function onVerified() {
    if (!phone) return;
    setSessionPhone(phone);
    router.push("/role");
  }

  return (
    <div className="grid min-h-screen grid-cols-[minmax(0,55fr)_minmax(0,45fr)]">
      <section className="relative min-h-screen overflow-hidden">
        <SeedImage src="https://picsum.photos/seed/cheqzo-login/1600/1200" alt="" sizes="55vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/35 to-foreground/15" />
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-12">
          <Wordmark light />
          <div>
            <p className="max-w-xl font-display text-[32px] leading-10 font-semibold text-primary-foreground">
              Every rupee, every room, every approval. In one place.
            </p>
            <ul className="mt-8 space-y-3">
              {POINTS.map((point) => (
                <li key={point.text} className="flex items-center gap-3 text-sm text-primary-foreground">
                  <point.icon className="size-4 shrink-0" />
                  {point.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-background px-10">
        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait">
            {phone ? (
              <motion.div key="otp" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={transition}>
                <OtpStep phone={phone} onChangeNumber={() => setPhone(null)} onSuccess={onVerified} />
              </motion.div>
            ) : (
              <motion.div key="phone" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={transition}>
                <PhoneStep onSent={setPhone} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
