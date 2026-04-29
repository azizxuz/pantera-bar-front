import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore, formatMoney } from "@/lib/store";
import { io } from "socket.io-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { OrderStatus } from "@/lib/types";
import { Bell, Check, Truck, X, Volume2, VolumeX, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUSES: OrderStatus[] = ["new", "accepted", "delivered", "canceled"];

function statusStyles(s: OrderStatus) {
  switch (s) {
    case "new":
      return "bg-primary/15 text-primary border-primary/30";
    case "accepted":
      return "bg-warning/15 text-warning border-warning/30";
    case "delivered":
      return "bg-success/15 text-success border-success/30";
    case "canceled":
      return "bg-destructive/15 text-destructive border-destructive/30";
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.45);
  } catch {
    /* noop */
  }
}

const AdminOrders = () => {
  const { t } = useTranslation();
  const orders = useStore((s) => s.orders);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const [tab, setTab] = useState<OrderStatus | "all">("new");
  const [sound, setSound] = useState(true);
  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // ─── REALTIME: supabase.channel() o'rniga socket.io ─────────────────
  // OLDIN: supabase.channel("admin-new-orders").on("postgres_changes", ...).subscribe()
  // KEYIN: socket.io "order:created" eventi
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:3000", {
      auth: { token: localStorage.getItem("token") },
    });

    socket.on("order:created", (o: { computer_number: number }) => {
      toast.success(t("admin.orders.newOrder", { n: o.computer_number }), {
        description: `#${o.computer_number}`,
      });
      if (soundRef.current) playBeep();
    });

    return () => {
      socket.disconnect();
    };
  }, [t]);
  // ─────────────────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    STATUSES.forEach(
      (s) => (c[s] = orders.filter((o) => o.status === s).length)
    );
    return c;
  }, [orders]);

  const filtered =
    tab === "all" ? orders : orders.filter((o) => o.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {t("admin.orders.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.orders.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass">
            {sound ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="sound" className="text-sm cursor-pointer">
              {t("admin.orders.sound")}
            </Label>
            <Switch id="sound" checked={sound} onCheckedChange={setSound} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            <span className="text-xs text-muted-foreground">LIVE</span>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="bg-card/50 h-auto flex-wrap">
          <TabsTrigger value="all" className="gap-2">
            {t("common.all")}{" "}
            <Badge variant="secondary" className="ml-1">
              {counts.all}
            </Badge>
          </TabsTrigger>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="gap-2 capitalize">
              {t(`admin.orders.${s}`)}
              <Badge variant="secondary" className="ml-1">
                {counts[s]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card className="glass p-12 text-center">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t("admin.orders.empty")}</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card
              key={o.id}
              className={cn(
                "glass p-4 transition-smooth animate-slide-in",
                o.status === "new" && "border-primary/40 shadow-glow"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl grid place-items-center font-display font-bold shrink-0",
                      o.status === "new"
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "bg-secondary text-foreground"
                    )}
                  >
                    {o.computerNumber}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.orders.computer")}
                    </p>
                    <p className="font-display font-bold text-lg leading-tight">
                      #{o.computerNumber}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn("capitalize", statusStyles(o.status))}
                >
                  {t(`admin.orders.${o.status}`)}
                </Badge>
              </div>

              <div className="space-y-1.5 mb-3 text-sm border-l-2 border-border pl-3">
                {o.items.map((it, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="truncate">
                      {it.name}{" "}
                      <span className="text-muted-foreground">
                        ×{it.quantity}
                      </span>
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {formatMoney(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(o.createdAt)}
                </span>
                <span className="font-display font-bold text-base text-gradient-primary">
                  {t("currency", { val: formatMoney(o.totalPrice) })}
                </span>
              </div>

              <div className="flex gap-2">
                {o.status === "new" && (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 bg-warning text-warning-foreground hover:bg-warning/90"
                      onClick={() => setOrderStatus(o.id, "accepted")}
                    >
                      <Check className="h-4 w-4 mr-1" />{" "}
                      {t("admin.orders.accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => setOrderStatus(o.id, "canceled")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {o.status === "accepted" && (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => setOrderStatus(o.id, "delivered")}
                    >
                      <Truck className="h-4 w-4 mr-1" />{" "}
                      {t("admin.orders.deliver")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => setOrderStatus(o.id, "canceled")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
