import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore, formatMoney } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Upload, X, Loader2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

const EMOJIS = [
  // drinks
  "🥤",
  "☕",
  "🍵",
  "💧",
  "⚡",
  "🧃",
  "🍹",
  "🍺",
  "🍷",
  "🥛",
  "🧋",
  // snacks
  "🍟",
  "🍫",
  "🥔",
  "🍿",
  "🥨",
  "🥜",
  "🍪",
  "🍩",
  "🧁",
  "🍰",
  "🍮",
  // food
  "🍔",
  "🌭",
  "🍕",
  "🥪",
  "🌮",
  "🌯",
  "🍜",
  "🍱",
  "🍣",
  "🍳",
  "🥗",
  // fruits / extra
  "🍎",
  "🍌",
  "🍓",
  "🍇",
  "🍊",
  "🍑",
  "🥝",
  "🍍",
  "🥥",
  "🍒",
  // misc
  "🎮",
  "🕹️",
  "🍭",
  "🍬",
  "🍦",
];

// ─── Upload helper (supabase.storage o'rniga) ────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      // Content-Type yozmang — FormData o'zi boundary qo'yadi
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Upload failed");
  }

  const { url } = await res.json(); // backend: { url: "/uploads/uuid.jpg" }
  return url.startsWith("http") ? url : `${API}${url}`;
}
// ─────────────────────────────────────────────────────────────────────────────

function ProductForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Product>;
  onSubmit: (data: Omit<Product, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState<number>(initial?.price ?? 10000);
  const [active, setActive] = useState(initial?.active ?? true);
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🥤");
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    initial?.imageUrl
  );
  const [tab, setTab] = useState<"emoji" | "image">(
    initial?.imageUrl ? "image" : "emoji"
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // OLDIN: supabase.storage.from("product-images").upload(...)
  // KEYIN: POST /upload endpoint ga fetch
  const onPick = async (f: File | null) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Max 2MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(f);
      setImageUrl(url);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || price < 0) return;
        onSubmit({
          name: name.trim(),
          price,
          active,
          emoji: tab === "emoji" ? emoji : initial?.emoji ?? emoji,
          imageUrl: tab === "image" ? imageUrl : undefined,
          category: initial?.category ?? "other",
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>{t("admin.products.visual") ?? "Visual"}</Label>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="emoji">Emoji / Sticker</TabsTrigger>
            <TabsTrigger value="image">Upload image</TabsTrigger>
          </TabsList>
          <TabsContent value="emoji" className="mt-3">
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto rounded-lg border border-border p-2">
              {EMOJIS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`h-9 w-9 rounded-lg text-xl grid place-items-center transition-smooth ${
                    emoji === e
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="image" className="mt-3">
            <div className="flex items-center gap-3">
              <div className="h-24 w-24 rounded-lg border border-border bg-secondary grid place-items-center overflow-hidden shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl opacity-50">🖼️</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPick(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploading ? "Uploading..." : "Choose image"}
                </Button>
                {imageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImageUrl(undefined)}
                  >
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  PNG/JPG, max 2MB
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("admin.products.name")}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">{t("admin.products.price")}</Label>
        <Input
          id="price"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          required
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label htmlFor="active" className="cursor-pointer">
          {t("admin.products.active")}
        </Label>
        <Switch id="active" checked={active} onCheckedChange={setActive} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          className="bg-gradient-primary text-primary-foreground"
        >
          {t("common.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}

const AdminProducts = () => {
  const { t } = useTranslation();
  const products = useStore((s) => s.products);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {t("admin.products.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("admin.products.subtitle")}
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
              <Plus className="h-4 w-4 mr-2" /> {t("admin.products.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("admin.products.new")}</DialogTitle>
            </DialogHeader>
            <ProductForm
              onCancel={() => setCreating(false)}
              onSubmit={(data) => {
                addProduct(data);
                setCreating(false);
                toast.success(t("common.save"));
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((p) => (
          <Card key={p.id} className="glass p-4 group relative">
            <div className="flex items-start justify-between mb-2">
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-secondary grid place-items-center">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">{p.emoji ?? "🍽️"}</span>
                )}
              </div>
              <Badge
                variant={p.active ? "default" : "outline"}
                className={
                  p.active ? "bg-success/20 text-success border-success/30" : ""
                }
              >
                {p.active ? "ON" : "OFF"}
              </Badge>
            </div>
            <p className="font-medium leading-tight mb-1 truncate">{p.name}</p>
            <p className="text-primary font-display font-bold">
              {t("currency", { val: formatMoney(p.price) })}
            </p>
            <div className="flex gap-1 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8"
                onClick={() => setEditing(p)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => updateProduct(p.id, { active: !p.active })}
              >
                <Switch
                  checked={p.active}
                  className="pointer-events-none scale-75"
                />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("admin.products.confirmDelete")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{p.name}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteProduct(p.id)}
                      className="bg-destructive text-destructive-foreground"
                    >
                      {t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.products.edit")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <ProductForm
              initial={editing}
              onCancel={() => setEditing(null)}
              onSubmit={(data) => {
                updateProduct(editing.id, data);
                setEditing(null);
                toast.success(t("common.save"));
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
