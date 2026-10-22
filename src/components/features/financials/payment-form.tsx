"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { paymentSchema, type PaymentFormValues } from "@/components/features/financials/payment-schema";
import { MoneyText } from "@/components/shared/MoneyText";
import { SeedImage } from "@/components/shared/SeedImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { exceedsRemaining, formatInrInput, parseInrInput } from "@/lib/financials";
import { PAYMENT_METHODS, PAYMENT_STAGES } from "@/lib/rules";
import { cn } from "@/lib/utils";
import type { Payment } from "@/types";

export function PaymentForm({
  defaultValues,
  remaining,
  submitLabel,
  confirmLabel,
  busy,
  onSubmit,
}: {
  defaultValues: PaymentFormValues;
  remaining: number;
  submitLabel: string;
  confirmLabel: string;
  busy: boolean;
  onSubmit: (values: PaymentFormValues) => Promise<boolean>;
}) {
  const [warn, setWarn] = useState(false);
  const [sending, setSending] = useState(false);
  const submitted = useRef(false);
  const created = useRef<string[]>([]);
  const form = useForm<PaymentFormValues>({
    defaultValues,
    resolver: zodResolver(paymentSchema),
  });
  const method = useWatch({ control: form.control, name: "method" });
  const amount = useWatch({ control: form.control, name: "amount" });
  const stage = useWatch({ control: form.control, name: "stage" });
  const receiptUrl = useWatch({ control: form.control, name: "receiptUrl" });
  const errors = form.formState.errors;

  useEffect(() => {
    const owned = created;
    const done = submitted;
    return () => {
      if (done.current) return;
      for (const url of owned.current) URL.revokeObjectURL(url);
    };
  }, []);

  function setReceipt(next: string) {
    const current = form.getValues("receiptUrl");
    if (current.startsWith("blob:") && created.current.includes(current)) {
      URL.revokeObjectURL(current);
      created.current = created.current.filter((url) => url !== current);
    }
    if (next.startsWith("blob:")) created.current.push(next);
    form.setValue("receiptUrl", next);
  }

  async function send(values: PaymentFormValues) {
    setSending(true);
    try {
      const saved = await onSubmit(values);
      if (saved) submitted.current = true;
    } finally {
      setSending(false);
    }
  }

  async function onValid(values: PaymentFormValues) {
    const amount = parseInrInput(values.amount);
    if (exceedsRemaining(amount, remaining)) {
      setWarn(true);
      return;
    }
    await send(values);
  }

  if (warn) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-foreground">
          This is more than the remaining balance of <MoneyText amount={remaining} />.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setWarn(false)} disabled={sending || busy}>
            Go back
          </Button>
          <Button type="button" onClick={() => void send(form.getValues())} disabled={sending || busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onValid)} className="space-y-4">
      <Field label="Amount" error={errors.amount?.message}>
        <Input
          inputMode="numeric"
          value={amount ?? ""}
          onChange={(event) => form.setValue("amount", formatInrInput(event.target.value), { shouldValidate: true })}
          placeholder="0"
          aria-label="Amount"
        />
      </Field>
      <Field label="Date" error={errors.date?.message}>
        <Input type="date" aria-label="Date" {...form.register("date")} />
      </Field>
      <Field label="Stage" error={errors.stage?.message}>
        <Select value={stage} onValueChange={(value) => form.setValue("stage", value as Payment["stage"], { shouldValidate: true })}>
          <SelectTrigger aria-label="Stage" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <fieldset>
        <legend className="text-sm font-medium text-foreground">Method</legend>
        <div role="radiogroup" aria-label="Method" className="mt-1.5 grid grid-cols-4 gap-1 rounded-lg border border-border p-1">
          {PAYMENT_METHODS.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={method === item}
              onClick={() => form.setValue("method", item, { shouldValidate: true })}
              className={cn(
                "rounded-md px-1 py-1.5 text-center text-[11px] leading-4",
                method === item ? "bg-primary text-primary-foreground" : "text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>
      {method === "Cash" ? null : (
        <Field label="Reference" error={errors.reference?.message}>
          <Input aria-label="Reference" placeholder="UTR, NEFT, or cheque number" {...form.register("reference")} />
        </Field>
      )}
      <Field label="Note" error={errors.note?.message}>
        <Textarea aria-label="Note" {...form.register("note")} />
      </Field>
      <Field label="Receipt">
        <Input
          type="file"
          accept="image/*"
          aria-label="Receipt image"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) return;
            setReceipt(URL.createObjectURL(file));
            event.target.value = "";
          }}
        />
        {receiptUrl ? (
          <div className="relative mt-2 h-36 overflow-hidden rounded-lg border border-border">
            <SeedImage src={receiptUrl} alt="Receipt" sizes="480px" />
            <Button type="button" variant="outline" size="sm" className="absolute right-2 bottom-2" onClick={() => setReceipt("")}>
              Remove
            </Button>
          </div>
        ) : null}
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={sending || busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-foreground">
      {label}
      <span className="block font-normal">{children}</span>
      {error ? <span className="block text-xs font-normal text-danger">{error}</span> : null}
    </label>
  );
}
