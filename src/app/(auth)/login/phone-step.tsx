"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Wordmark } from "@/components/shell/Wordmark";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { OTP_SEND_DELAY_MS, normalizePhone, phoneSchema } from "@/lib/auth";
import { delay } from "@/lib/demo";

const schema = z.object({ phone: phoneSchema });
type PhoneValues = z.infer<typeof schema>;

export function PhoneStep({ onSent }: { onSent: (phone: string) => void }) {
  const [sending, setSending] = useState(false);
  const form = useForm<PhoneValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
  });
  const error = form.formState.errors.phone?.message;

  async function onSubmit(values: PhoneValues) {
    setSending(true);
    await delay(OTP_SEND_DELAY_MS);
    setSending(false);
    onSent(values.phone);
  }

  return (
    <form className="flex flex-col" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <Wordmark />
      <h1 className="mt-8 font-display text-[28px] leading-9 font-semibold text-foreground">Welcome back</h1>
      <label htmlFor="phone" className="mt-8 text-sm font-medium text-foreground">
        Mobile number
      </label>
      <InputGroup className="mt-2 h-10 bg-surface">
        <InputGroupAddon>
          <InputGroupText>
            <span aria-hidden className="india-flag" />
            +91
          </InputGroupText>
        </InputGroupAddon>
        <Controller
          name="phone"
          control={form.control}
          render={({ field }) => (
            <InputGroupInput
              id="phone"
              inputMode="numeric"
              autoComplete="tel"
              autoFocus
              placeholder="98450 11101"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "phone-error" : undefined}
              name={field.name}
              ref={field.ref}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(normalizePhone(event.target.value))}
            />
          )}
        />
      </InputGroup>
      {error ? (
        <p id="phone-error" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="mt-6 h-10 w-full" disabled={sending}>
        {sending ? <LoaderCircle className="animate-spin" /> : null}
        {sending ? "Sending…" : "Send OTP"}
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">Demo: use any 10-digit number</p>
    </form>
  );
}
