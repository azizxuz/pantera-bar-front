// src/store.ts
import { create } from "zustand";
import { api } from "@/lib/apiClient";
import { io, Socket } from "socket.io-client";
import type { Computer, Order, OrderItem, OrderStatus, Product } from "./types";
import { toast } from "sonner";

// Supabasedagi mapper logika saqlanadi — faqat manba o'zgaradi
const mapProduct = (r: any): Product => ({
  id: r.id,
  name: r.name,
  price: Number(r.price),
  active: r.active,
  emoji: r.emoji ?? undefined,
  imageUrl: r.imageUrl ?? r.image_url ?? undefined,
  category: r.category ?? "other",
  createdAt: r.createdAt ?? r.created_at,
});
const mapComputer = (r: any): Computer => ({
  id: r.id,
  number: r.number,
  token: r.token,
  tokenExpiresAt: r.tokenExpiresAt ?? r.token_expires_at,
  enabled: r.enabled,
  createdAt: r.createdAt ?? r.created_at,
});
const mapOrder = (r: any, items: OrderItem[] = []): Order => ({
  id: r.id,
  computerId: r.computerId ?? r.computer_id,
  computerNumber: r.computerNumber ?? r.computer_number,
  status: r.status,
  totalPrice: Number(r.totalPrice ?? r.total_price),
  items: r.items ?? items,
  createdAt: r.createdAt ?? r.created_at,
  updatedAt: r.updatedAt ?? r.updated_at,
});

let socket: Socket | null = null;

interface State {
  isAuthed: boolean;
  loading: boolean;
  computers: Computer[];
  products: Product[];
  orders: Order[];

  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;

  addProduct: (p: Omit<Product, "id" | "createdAt">) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addComputer: () => Promise<void>;
  rotateToken: (id: string) => Promise<void>;
  toggleComputer: (id: string) => Promise<void>;
  deleteComputer: (id: string) => Promise<void>;

  createOrder: (
    computerId: string,
    items: OrderItem[]
  ) => Promise<Order | null>;
  setOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
}

export const useStore = create<State>()((set, get) => ({
  isAuthed: !!localStorage.getItem("token"),
  loading: true,
  computers: [],
  products: [],
  orders: [],

  // ─── AUTH ────────────────────────────────────────────────────────────
  // OLDIN: supabase.auth.getSession() + onAuthStateChange
  // KEYIN: token localStorage da, mavjudligi = authed
  init: async () => {
    const token = localStorage.getItem("token");
    set({ isAuthed: !!token });

    await Promise.all([
      refetch(set, "products"),
      refetch(set, "computers"),
      refetch(set, "orders"),
    ]);
    set({ loading: false });

    // ─── REALTIME ────────────────────────────────────────────────────
    // OLDIN: supabase.channel().on('postgres_changes', ...).subscribe()
    // KEYIN: socket.io events
    if (!socket) {
      socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:3000", {
        auth: { token },
      });

      socket.on("products:changed", () => refetch(set, "products"));
      socket.on("computers:changed", () => refetch(set, "computers"));
      socket.on("orders:changed", () => refetch(set, "orders"));
    }
  },

  // OLDIN: supabase.auth.signInWithPassword({ email, password })
  // KEYIN: POST /auth/login → { access_token }
  signIn: async (email, password) => {
    try {
      const { access_token } = await api.post<{ access_token: string }>(
        "/auth/login",
        { email, password }
      );
      localStorage.setItem("token", access_token);
      set({ isAuthed: true });
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  },

  // OLDIN: supabase.auth.signOut()
  // KEYIN: tokenni o'chirish
  signOut: async () => {
    localStorage.removeItem("token");
    socket?.disconnect();
    socket = null;
    set({ isAuthed: false });
  },

  // ─── PRODUCTS ────────────────────────────────────────────────────────
  // OLDIN: supabase.from('products').insert(...)
  // KEYIN: POST /products
  addProduct: async (p) => {
    try {
      await api.post("/products", {
        name: p.name,
        price: p.price,
        active: p.active,
        emoji: p.emoji ?? null,
        imageUrl: p.imageUrl ?? null,
        category: p.category ?? "other",
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  },

  // OLDIN: supabase.from('products').update(u).eq('id', id)
  // KEYIN: PATCH /products/:id
  updateProduct: async (id, patch) => {
    try {
      await api.patch(`/products/${id}`, {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.price !== undefined && { price: patch.price }),
        ...(patch.active !== undefined && { active: patch.active }),
        ...(patch.emoji !== undefined && { emoji: patch.emoji ?? null }),
        ...(patch.imageUrl !== undefined && {
          imageUrl: patch.imageUrl ?? null,
        }),
        ...(patch.category !== undefined && { category: patch.category }),
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  },

  // OLDIN: supabase.from('products').delete().eq('id', id)
  // KEYIN: DELETE /products/:id
  deleteProduct: async (id) => {
    try {
      await api.delete(`/products/${id}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  },

  // ─── COMPUTERS ───────────────────────────────────────────────────────
  // OLDIN: supabase.from('computers').insert({ number, token })
  // KEYIN: POST /computers  (token backend da generatsiya qilinadi)
  addComputer: async () => {
    try {
      await api.post("/computers", {});
    } catch (e: any) {
      toast.error(e.message);
    }
  },

  // OLDIN: supabase.from('computers').update({ token, token_expires_at }).eq('id', id)
  // KEYIN: POST /computers/:id/rotate-token
  rotateToken: async (id) => {
    try {
      await api.post(`/computers/${id}/rotate-token`, {});
    } catch (e: any) {
      toast.error(e.message);
    }
  },

  // OLDIN: supabase.from('computers').update({ enabled: !c.enabled }).eq('id', id)
  // KEYIN: PATCH /computers/:id
  toggleComputer: async (id) => {
    const c = get().computers.find((x) => x.id === id);
    if (!c) return;
    try {
      await api.patch(`/computers/${id}`, { enabled: !c.enabled });
    } catch (e: any) {
      toast.error(e.message);
    }
  },

  // OLDIN: supabase.from('computers').delete().eq('id', id)
  // KEYIN: DELETE /computers/:id
  deleteComputer: async (id) => {
    try {
      await api.delete(`/computers/${id}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  },

  // ─── ORDERS ──────────────────────────────────────────────────────────
  // OLDIN: supabase.from('orders').insert(...) + supabase.from('order_items').insert(...)
  // KEYIN: POST /orders  (items ham birga yuboriladi)
  createOrder: async (computerId, items) => {
    const computer = get().computers.find((c) => c.id === computerId);
    if (!computer?.enabled) return null;
    try {
      const order = await api.post<Order>("/orders", {
        computerId,
        items: items.map((it) => ({
          productId: it.productId || null,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
        })),
      });
      return mapOrder(order);
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  },

  // OLDIN: supabase.from('orders').update({ status }).eq('id', id)
  // KEYIN: PATCH /orders/:id
  setOrderStatus: async (id, status) => {
    try {
      await api.patch(`/orders/${id}`, { status });
    } catch (e: any) {
      toast.error(e.message);
    }
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function refetch(
  set: any,
  resource: "products" | "computers" | "orders"
) {
  try {
    const data = await api.get<any[]>(`/${resource}`);
    if (resource === "products") set({ products: data.map(mapProduct) });
    if (resource === "computers") set({ computers: data.map(mapComputer) });
    if (resource === "orders") set({ orders: data.map(mapOrder) });
  } catch {
    /* silent */
  }
}

export const formatMoney = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n));
