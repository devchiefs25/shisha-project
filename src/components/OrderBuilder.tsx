"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Flame, Apple, Sparkles, Truck, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { ADDONS, BASES, FLAVOURS, HEADS, type Base, type Head } from "@/lib/catalog";

const STEPS = ["Base", "Flavours", "Head", "Add-ons", "Delivery"] as const;

export function OrderBuilder() {
  const createOrder = useMutation(api.orders.createOrder);
  const [step, setStep] = useState(0);
  const [base, setBase] = useState<Base>(BASES[0]);
  const [flavours, setFlavours] = useState<string[]>([]);
  const [head, setHead] = useState<Head>(HEADS[0]);
  const [addons, setAddons] = useState<Record<string, number>>({});
  const [details, setDetails] = useState({ name: "", phone: "", address: "", time: "", notes: "" });
  const [submitted, setSubmitted] = useState<{ orderId: string; total: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxFlavours = base.name.startsWith("Mixed") ? 3 : 1;

  const total = useMemo(() => {
    const addonsTotal = Object.entries(addons).reduce((sum, [name, qty]) => {
      const a = ADDONS.find((x) => x.name === name);
      return sum + (a ? a.price * qty : 0);
    }, 0);
    return base.price + head.price + addonsTotal;
  }, [base, head, addons]);

  const toggleFlavour = (f: string) => {
    setFlavours((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : prev.length < maxFlavours ? [...prev, f] : [...prev.slice(1), f]
    );
  };

  const adjustAddon = (name: string, delta: number) => {
    setAddons((prev) => {
      const next = { ...prev, [name]: Math.max(0, (prev[name] ?? 0) + delta) };
      if (next[name] === 0) delete next[name];
      return next;
    });
  };

  const canNext = () => {
    if (step === 1) return flavours.length > 0;
    if (step === 4) return details.name && details.phone && details.address && details.time;
    return true;
  };

  const handleSubmit = async () => {
    if (!canNext() || isSubmitting) return;

    const deliveryTimeMs = new Date(details.time).getTime();
    if (!Number.isFinite(deliveryTimeMs)) {
      toast.error("Please pick a valid delivery time");
      return;
    }

    const addonsArr = Object.entries(addons).map(([name, qty]) => {
      const a = ADDONS.find((x) => x.name === name);
      return { name, price: a?.price ?? 0, qty };
    });

    setIsSubmitting(true);
    try {
      const result = await createOrder({
        base: { name: base.name, price: base.price, desc: base.desc },
        flavours,
        head: { name: head.name, price: head.price },
        addons: addonsArr,
        customer: {
          name: details.name.trim(),
          phone: details.phone.trim(),
          address: details.address.trim(),
          deliveryTime: deliveryTimeMs,
          notes: details.notes.trim() || undefined,
        },
      });
      setSubmitted({ orderId: result.orderId, total: result.total });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not place order. Please try again.";
      toast.error(message.replace(/^\[CONVEX[^\]]*\]\s*/, ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    const shortId = submitted.orderId.slice(-6).toUpperCase();
    return (
      <section id="order" className="container mx-auto px-6 py-24">
        <div className="max-w-xl mx-auto text-center rounded-3xl border border-gold/50 bg-card/80 backdrop-blur p-12 shadow-gold animate-float-up">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient">
            <Check className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-4xl font-display text-gradient-gold mb-3">Order Placed</h2>
          <p className="text-muted-foreground mb-2">Thank you, {details.name}.</p>
          <p className="text-muted-foreground">A rider is being dispatched to {details.address} for {details.time}.</p>
          <p className="mt-6 text-2xl font-display text-gold">Total: ${submitted.total.toFixed(2)}</p>
          <p className="mt-2 text-xs tracking-[0.3em] text-muted-foreground">REF #{shortId}</p>
          <button
            onClick={() => {
              setSubmitted(null);
              setStep(0);
              setFlavours([]);
              setAddons({});
              setDetails({ name: "", phone: "", address: "", time: "", notes: "" });
            }}
            className="mt-8 rounded-full border border-gold/40 px-6 py-2.5 text-sm text-gold hover:bg-gold/10 transition"
          >
            Build another
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="order" className="container mx-auto px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="text-xs tracking-[0.4em] text-gold mb-3">BUILD YOUR SHISHA</div>
        <h2 className="text-4xl md:text-5xl font-display text-gradient-gold">Customise. Order. Inhale.</h2>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    i < step ? "bg-gold-gradient border-gold text-primary-foreground" :
                    i === step ? "border-gold text-gold shadow-gold" : "border-border text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <div className={`mt-2 text-[10px] tracking-widest ${i === step ? "text-gold" : "text-muted-foreground"}`}>{label.toUpperCase()}</div>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 mx-2 ${i < step ? "bg-gold" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-xl p-8 md:p-10 shadow-deep min-h-[420px]">
          <div key={step} className="animate-slide-in">
            {step === 0 && (
              <div>
                <StepHeader icon={<Flame className="h-5 w-5" />} title="Choose your base" />
                <div className="grid md:grid-cols-3 gap-4">
                  {BASES.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => { setBase(b); if (!b.name.startsWith("Mixed")) setFlavours(flavours.slice(0, 1)); }}
                      className={`text-left rounded-2xl border p-5 transition hover:-translate-y-0.5 ${
                        base.name === b.name ? "border-gold bg-gold/10 shadow-gold" : "border-border hover:border-gold/50"
                      }`}
                    >
                      <div className="text-lg font-display text-foreground">{b.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{b.desc}</div>
                      <div className="mt-4 text-2xl font-display text-gold">${b.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <StepHeader
                  icon={<Sparkles className="h-5 w-5" />}
                  title={`Pick your flavour${maxFlavours > 1 ? `s (up to ${maxFlavours})` : ""}`}
                  hint={`${flavours.length}/${maxFlavours} selected`}
                />
                <div className="space-y-6 max-h-[420px] overflow-y-auto pr-2">
                  {Object.entries(FLAVOURS).map(([brand, list]) => (
                    <div key={brand}>
                      <div className="text-xs tracking-[0.3em] text-gold mb-3">{brand.toUpperCase()}</div>
                      <div className="flex flex-wrap gap-2">
                        {list.map((f) => (
                          <button
                            key={f}
                            onClick={() => toggleFlavour(f)}
                            className={`rounded-full border px-4 py-2 text-sm transition ${
                              flavours.includes(f)
                                ? "border-gold bg-gold/15 text-gold shadow-gold"
                                : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <StepHeader icon={<Apple className="h-5 w-5" />} title="Head style" />
                <div className="grid md:grid-cols-2 gap-3">
                  {HEADS.map((h) => (
                    <button
                      key={h.name}
                      onClick={() => setHead(h)}
                      className={`flex items-center justify-between rounded-xl border p-4 transition ${
                        head.name === h.name ? "border-gold bg-gold/10 shadow-gold" : "border-border hover:border-gold/50"
                      }`}
                    >
                      <span className="text-foreground">{h.name}</span>
                      <span className="text-gold font-medium">{h.price === 0 ? "Included" : `+$${h.price}`}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <StepHeader icon={<Sparkles className="h-5 w-5" />} title="Add-ons (optional)" />
                <div className="space-y-2">
                  {ADDONS.map((a) => {
                    const qty = addons[a.name] ?? 0;
                    return (
                      <div key={a.name} className={`flex items-center justify-between rounded-xl border p-4 transition ${qty > 0 ? "border-gold/60 bg-gold/5" : "border-border"}`}>
                        <div>
                          <div className="text-foreground">{a.name}</div>
                          <div className="text-xs text-gold">${a.price}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => adjustAddon(a.name, -1)} className="h-8 w-8 rounded-full border border-border hover:border-gold/60 transition">−</button>
                          <span className="w-6 text-center text-gold">{qty}</span>
                          <button onClick={() => adjustAddon(a.name, 1)} className="h-8 w-8 rounded-full border border-border hover:border-gold/60 transition">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <StepHeader icon={<Truck className="h-5 w-5" />} title="Delivery details" />
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Your name" value={details.name} onChange={(v) => setDetails({ ...details, name: v })} placeholder="Jane Doe" />
                  <Field label="Phone" value={details.phone} onChange={(v) => setDetails({ ...details, phone: v })} placeholder="04xx xxx xxx" />
                  <Field label="Address" value={details.address} onChange={(v) => setDetails({ ...details, address: v })} placeholder="123 Smith St, Melbourne" className="md:col-span-2" />
                  <Field label="Delivery time" type="datetime-local" value={details.time} onChange={(v) => setDetails({ ...details, time: v })} />
                  <Field label="Notes (optional)" value={details.notes} onChange={(v) => setDetails({ ...details, notes: v })} placeholder="Buzz #2, no contact..." />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Nav */}
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 backdrop-blur p-4 px-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || isSubmitting}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold disabled:opacity-30 disabled:hover:text-muted-foreground transition"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="text-right">
            <div className="text-[10px] tracking-widest text-muted-foreground">RUNNING TOTAL</div>
            <div className="text-2xl font-display text-gradient-gold">${total.toFixed(2)}</div>
          </div>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canNext() && setStep((s) => s + 1)}
              disabled={!canNext()}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-gold disabled:opacity-40 hover:scale-[1.03] transition-transform"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canNext() || isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-gold disabled:opacity-40 hover:scale-[1.03] transition-transform"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Placing..." : "Place Order"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function StepHeader({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold/40 bg-gold/5 text-gold">{icon}</div>
        <h3 className="text-2xl font-display text-foreground">{title}</h3>
      </div>
      {hint && <div className="text-xs text-gold tracking-widest">{hint}</div>}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", className = "",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
      />
    </label>
  );
}
