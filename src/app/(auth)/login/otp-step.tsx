"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import { useForm } from "react-hook-form";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";

import { DisabledHint } from "@/components/shell/DisabledHint";
import { Button } from "@/components/ui/button";
import { DEMO_OTP, OTP_LENGTH, OTP_RESEND_SECONDS, maskPhone, otpMatches } from "@/lib/auth";

const schema = z.object({
  code: z.string().length(OTP_LENGTH, "Enter all 6 digits"),
});

interface OtpStepProps {
  phone: string;
  onSuccess: () => void;
  onChangeNumber: () => void;
}

export function OtpStep({ phone, onSuccess, onChangeNumber }: OtpStepProps) {
  const reduce = useReducedMotion() === true;
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ""));
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const [verified, setVerified] = useState(false);
  const controls = useAnimation();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const form = useForm<{ code: string }>({ resolver: zodResolver(schema), defaultValues: { code: "" } });
  const code = digits.join("");
  const incomplete = code.length < OTP_LENGTH;

  useEffect(() => {
    if (seconds === 0) return;
    const id = window.setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds]);

  useEffect(() => {
    if (!verified) return;
    const id = window.setTimeout(onSuccess, reduce ? 0 : 700);
    return () => window.clearTimeout(id);
  }, [onSuccess, reduce, verified]);

  function write(next: string[]) {
    setDigits(next);
    form.setValue("code", next.join(""), { shouldValidate: false });
    form.clearErrors("code");
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;
    event.preventDefault();
    const next = Array.from({ length: OTP_LENGTH }, (_, index) => text[index] ?? "");
    write(next);
    inputs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  }

  function onSubmit(values: { code: string }) {
    if (!otpMatches(values.code)) {
      form.setError("code", { message: "That code doesn't match. Try 123456." });
      if (!reduce) void controls.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }
    setVerified(true);
  }

  const clock = `0:${seconds.toString().padStart(2, "0")}`;
  const error = form.formState.errors.code?.message;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">Enter the code</h1>
      <p className="mt-2 text-sm text-muted-foreground">Enter the 6-digit code sent to +91 {maskPhone(phone)}</p>
      <motion.div className="mt-8 flex justify-between gap-2" animate={controls}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            value={digit}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoFocus={index === 0}
            maxLength={1}
            aria-label={`Digit ${index + 1}`}
            disabled={verified}
            onPaste={onPaste}
            onChange={(event) => {
              const nextDigit = event.target.value.replace(/\D/g, "").slice(-1);
              const next = [...digits];
              next[index] = nextDigit;
              write(next);
              if (nextDigit && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && digit === "" && index > 0) {
                event.preventDefault();
                const next = [...digits];
                next[index - 1] = "";
                write(next);
                inputs.current[index - 1]?.focus();
              }
            }}
            className="h-12 w-11 rounded-lg border border-input bg-surface text-center font-display text-lg text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
          />
        ))}
      </motion.div>
      {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
      {verified ? (
        <motion.p
          className="mt-6 flex items-center gap-2 text-sm font-medium text-success"
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <CircleCheck className="size-5" />
          Verified
        </motion.p>
      ) : (
        <DisabledHint disabled={incomplete} reason="Enter all 6 digits">
          <Button type="submit" className="mt-6 h-10 w-full" disabled={incomplete}>
            Verify
          </Button>
        </DisabledHint>
      )}
      <div className="mt-4 flex items-center justify-between text-sm">
        <DisabledHint disabled={seconds > 0} reason="You can resend when the timer ends">
          <button
            type="button"
            className="text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:text-muted-foreground"
            disabled={seconds > 0 || verified}
            onClick={() => {
              setSeconds(OTP_RESEND_SECONDS);
              toast.success("Code sent");
            }}
          >
            {seconds > 0 ? `Resend in ${clock}` : "Resend"}
          </button>
        </DisabledHint>
        <button
          type="button"
          className="text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={onChangeNumber}
          disabled={verified}
        >
          Change number
        </button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Demo OTP: {DEMO_OTP}</p>
    </form>
  );
}
