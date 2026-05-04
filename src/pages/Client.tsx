// src/pages/ClientMenu.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore, formatMoney } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Gamepad2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { OrderItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const STORAGE_KEY = "cc_active_computer_token";

// ─── Kompyuter tanlash sahifasi ───────────────────────────────────────────────

const ClientPickComputer = () => {
  const { t } = useTranslation();
  const computers = useStore((s) => s.computers);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      <header className="relative z-10 container flex items-center justify-between py-5">
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">{t("common.back")}</span>
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="relative z-10 container pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-primary items-center justify-center shadow-glow mb-4">
            <Gamepad2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {t("client.pickComputer")}
          </h1>
          <p className="text-muted-foreground">{t("client.pickHint")}</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3 max-w-5xl mx-auto">
          {computers.map((c) => (
            <Link
              key={c.id}
              to={`/client/${c.token}`}
              className={cn(
                "aspect-square rounded-xl glass grid place-items-center font-display font-bold text-lg sm:text-xl transition-smooth hover:scale-105 hover:border-primary/60",
                !c.enabled && "opacity-40 pointer-events-none"
              )}
            >
              <span className="text-gradient-primary">{c.number}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

// ─── Menyu sahifasi ───────────────────────────────────────────────────────────

const ClientMenu = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const computers = useStore((s) => s.computers);
  const allProducts = useStore((s) => s.products);
  const orders = useStore((s) => s.orders);
  const createOrder = useStore((s) => s.createOrder);

  const computer = useMemo(
    () => computers.find((c) => c.token === token),
    [computers, token]
  );
  const products = useMemo(
    () => allProducts.filter((p) => p.active),
    [allProducts]
  );
  const recent = useMemo(
    () => orders.filter((o) => o.computerId === computer?.id).slice(0, 3),
    [orders, computer?.id]
  );

  const [cart, setCart] = useState<Record<string, number>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_KEY, token);
  }, [token]);

  // ─── Invalid / offline holatlari ─────────────────────────────────────
  if (!computer) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-hero p-6">
        <Card className="max-w-md p-8 text-center glass">
          <p className="text-muted-foreground mb-4">Invalid computer token.</p>
          <Button onClick={() => navigate("/client")}>
            {t("client.change")}
          </Button>
        </Card>
      </div>
    );
  }

  if (!computer.enabled) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-hero p-6">
        <Card className="max-w-md p-8 text-center glass">
          <h2 className="font-display text-xl mb-2">#{computer.number}</h2>
          <p className="text-muted-foreground mb-4">{t("client.offline")}</p>
          <Button variant="outline" onClick={() => navigate("/client")}>
            {t("client.change")}
          </Button>
        </Card>
      </div>
    );
  }

  // ─── Cart hisob-kitob ─────────────────────────────────────────────────
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const p = products.find((x) => x.id === id);
      if (!p) return null;
      return { p, qty };
    })
    .filter(Boolean) as { p: (typeof products)[number]; qty: number }[];

  const total = cartItems.reduce((s, it) => s + it.p.price * it.qty, 0);
  const totalCount = cartItems.reduce((s, it) => s + it.qty, 0);

  // ─── Cart amallar ─────────────────────────────────────────────────────
  const inc = (id: string) =>
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));

  const dec = (id: string) =>
    setCart((c) => {
      const next = (c[id] || 0) - 1;
      const copy = { ...c };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  // ✅ TUZATILDI: computer.id to'g'ri uzatiladi, items faqat productId + quantity
  const send = async () => {
    setSending(true);
    try {
      const items: OrderItem[] = cartItems.map(({ p, qty }) => ({
        productId: p.id,
        name: p.name, // UI uchun saqlanadi (local state)
        price: p.price, // UI uchun saqlanadi (local state)
        quantity: qty,
      }));

      const order = await createOrder(computer.id, items);

      if (order) {
        toast.success(t("client.orderSent"), {
          description: t("client.orderSentDesc", { n: computer.number }),
        });
        setCart({});
      }
    } finally {
      setSending(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-hero pb-32">
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 sticky top-0 glass border-b border-border">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <span className="font-display font-bold text-primary-foreground">
                {computer.number}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none">
                {t("client.computer")}
              </p>
              <p className="font-display font-semibold leading-tight">
                #{computer.number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/client")}
            >
              {t("client.change")}
            </Button>
          </div>
        </div>
      </header>

      {/* Menyu */}
      <main className="relative z-10 container pt-6">
        <h2 className="font-display text-2xl font-bold mb-4">
          {t("client.menu")}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((p) => {
            const qty = cart[p.id] || 0;
            return (
              <Card
                key={p.id}
                className={cn(
                  "p-4 glass transition-smooth hover:border-primary/50 cursor-pointer relative",
                  qty > 0 && "border-primary shadow-glow"
                )}
                onClick={() => inc(p.id)}
              >
                {p.imageUrl ? (
                  <div className="h-16 w-16 rounded-lg overflow-hidden mb-2 bg-secondary">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-4xl mb-2">{p.emoji ?? "🍽️"}</div>
                )}
                <p className="font-medium leading-tight mb-1 text-sm">
                  {p.name}
                </p>
                <p className="text-primary font-display font-bold">
                  {t("currency", { val: formatMoney(p.price) })}
                </p>
                {qty > 0 && (
                  <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-bold shadow-glow">
                    {qty}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* So'nggi buyurtmalar */}
        {recent.length > 0 && (
          <div className="mt-10">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("client.recent")}
            </h3>
            <div className="space-y-2">
              {recent.map((o) => (
                <Card
                  key={o.id}
                  className="glass p-3 flex items-center justify-between"
                >
                  <div className="text-sm">
                    <p className="font-medium">
                      {o.items
                        .map((i) => `${i.name} ×${i.quantity}`)
                        .join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {o.status}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Pastki cart panel */}
      {totalCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-20 animate-slide-in">
          <div className="container pb-4">
            <Card className="glass border-primary/40 shadow-elevated p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-primary grid place-items-center shadow-glow shrink-0">
                  <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {totalCount} {t("client.items")}
                  </p>
                  <p className="font-display font-bold text-lg leading-tight">
                    {t("currency", { val: formatMoney(total) })}
                  </p>
                </div>
                <CartSheet
                  items={cartItems}
                  onInc={inc}
                  onDec={dec}
                  onClear={() => setCart({})}
                  onSend={send}
                  total={total}
                  sending={sending}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Cart Sheet ───────────────────────────────────────────────────────────────

function CartSheet({
  items,
  onInc,
  onDec,
  onClear,
  onSend,
  total,
  sending,
}: {
  items: {
    p: { id: string; name: string; price: number; emoji?: string };
    qty: number;
  }[];
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onClear: () => void;
  onSend: () => void;
  total: number;
  sending: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleSend = async () => {
    await onSend();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="bg-gradient-primary text-primary-foreground shadow-glow"
        >
          {t("client.cart")}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">
            {t("client.cart")}
          </SheetTitle>
        </SheetHeader>

        {/* Items ro'yxati */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {t("client.empty")}
            </p>
          )}
          {items.map(({ p, qty }) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
            >
              <div className="text-2xl">{p.emoji ?? "🍽️"}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium leading-tight">{p.name}</p>
                <p className="text-sm text-primary">
                  {t("currency", { val: formatMoney(p.price) })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => onDec(p.id)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-8 text-center font-bold">{qty}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => onInc(p.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("client.total")}</span>
            <span className="font-display text-2xl font-bold text-gradient-primary">
              {t("currency", { val: formatMoney(total) })}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClear}
              className="shrink-0"
              disabled={sending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={items.length === 0 || sending}
              className="flex-1 bg-gradient-primary text-primary-foreground shadow-glow h-12"
            >
              {sending ? (
                <span className="animate-pulse">{t("client.sending")}…</span>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  {t("client.sendOrder")}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { ClientPickComputer, ClientMenu };
