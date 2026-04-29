import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore, formatMoney } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, ShoppingBag, Receipt, Trophy } from "lucide-react";

type Range = "today" | "week" | "month";

function rangeStart(r: Range) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (r === "week") d.setDate(d.getDate() - 6);
  if (r === "month") d.setDate(d.getDate() - 29);
  return d;
}

const COLORS = ["hsl(184 100% 54%)", "hsl(300 100% 60%)", "hsl(220 100% 60%)", "hsl(38 100% 56%)", "hsl(142 76% 50%)", "hsl(260 100% 65%)"];

const AdminReports = () => {
  const { t } = useTranslation();
  const orders = useStore((s) => s.orders);
  const [range, setRange] = useState<Range>("week");

  const data = useMemo(() => {
    const start = rangeStart(range);
    const filtered = orders.filter((o) => o.status !== "canceled" && new Date(o.createdAt) >= start);
    const totalOrders = filtered.length;
    const revenue = filtered.reduce((s, o) => s + o.totalPrice, 0);
    const avgOrder = totalOrders ? revenue / totalOrders : 0;

    // Revenue by day
    const days: Record<string, number> = {};
    filtered.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      days[key] = (days[key] || 0) + o.totalPrice;
    });
    const revenueByDay = Object.entries(days).map(([day, val]) => ({ day, val }));

    // Orders by hour
    const hours: Record<number, number> = {};
    filtered.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      hours[h] = (hours[h] || 0) + 1;
    });
    const ordersByHour = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, count: hours[h] || 0 }));

    // Top products
    const prodMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    filtered.forEach((o) => {
      o.items.forEach((it) => {
        if (!prodMap[it.productId]) prodMap[it.productId] = { name: it.name, qty: 0, revenue: 0 };
        prodMap[it.productId].qty += it.quantity;
        prodMap[it.productId].revenue += it.price * it.quantity;
      });
    });
    const topProducts = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 6);

    return { totalOrders, revenue, avgOrder, revenueByDay, ordersByHour, topProducts };
  }, [orders, range]);

  const stats = [
    { label: t("admin.reports.totalOrders"), value: data.totalOrders.toString(), icon: ShoppingBag, color: "primary" },
    { label: t("admin.reports.revenue"), value: t("currency", { val: formatMoney(data.revenue) }), icon: TrendingUp, color: "accent" },
    { label: t("admin.reports.avgOrder"), value: t("currency", { val: formatMoney(data.avgOrder) }), icon: Receipt, color: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("admin.reports.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("admin.reports.subtitle")}</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="today">{t("admin.reports.today")}</TabsTrigger>
            <TabsTrigger value="week">{t("admin.reports.week")}</TabsTrigger>
            <TabsTrigger value="month">{t("admin.reports.month")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s, i) => (
          <Card key={i} className="glass p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <div className={`h-9 w-9 rounded-lg grid place-items-center ${s.color === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass p-5">
          <h3 className="font-display font-semibold mb-4">{t("admin.reports.revenueByDay")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatMoney(v)} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => formatMoney(v)}
                />
                <Bar dataKey="val" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass p-5">
          <h3 className="font-display font-semibold mb-4">{t("admin.reports.ordersByHour")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ordersByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="glass p-5">
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" />
          {t("admin.reports.topProducts")}
        </h3>
        {data.topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("common.empty")}</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.topProducts} dataKey="qty" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                    {data.topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="font-medium truncate">{p.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">{p.qty}×</div>
                    <div className="text-xs text-muted-foreground">{t("currency", { val: formatMoney(p.revenue) })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminReports;
