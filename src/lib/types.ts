export type OrderStatus = "new" | "accepted" | "delivered" | "canceled";

export interface Computer {
  id: string;
  number: number;          // 1..51
  token: string;           // long-lived token (mock)
  tokenExpiresAt: string;  // ISO
  enabled: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  active: boolean;
  emoji?: string;
  imageUrl?: string; // data URL or remote URL
  category?: "drink" | "snack" | "food" | "other";
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;     // captured at order time
  quantity: number;
}

export interface Order {
  id: string;
  computerId: string;
  computerNumber: number;
  status: OrderStatus;
  items: OrderItem[];
  totalPrice: number;
  createdAt: string; // ISO
  updatedAt: string;
}

export interface Admin {
  email: string;
  password: string;
}
