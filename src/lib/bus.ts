/**
 * Simple cross-tab "realtime" bus.
 * Stands in for a WebSocket: when the client tab dispatches an event,
 * the admin tab (open in another window) receives it instantly.
 */
type Listener = (msg: any) => void;

const CHANNEL = "cybercafe-bus";

class Bus {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<Listener>();

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = (e) => this.listeners.forEach((l) => l(e.data));
    }
  }

  emit(type: string, payload?: any) {
    const msg = { type, payload, ts: Date.now() };
    // Always notify same-tab listeners
    this.listeners.forEach((l) => l(msg));
    this.channel?.postMessage(msg);
  }

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const bus = new Bus();
