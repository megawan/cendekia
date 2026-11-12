import { useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { BottomSheet, BottomSheetClose } from "./components/arc/bottom-sheet/bottom-sheet";
import { AnimatedCounter } from "./components/arc/animated-counter/animated-counter";
import { ToastStack, ToastStackProvider, useToastStack, type ToastOptions } from "./components/arc/toast-stack/toast-stack";
import "./components/arc/foundation.css";

// Bridge between Logica's plain script and the React components. Everything lives under .arc-ui so the
// Arc tokens (--accent, --radius, ...) never touch Logica's own variables.
let toastApi: ReturnType<typeof useToastStack> | null = null;
const pending: ToastOptions[] = [];

function ToastBridge() {
  toastApi = useToastStack();
  // Toasts asked for before React finished mounting.
  for (const t of pending.splice(0)) toastApi.toast(t);
  return null;
}

// One sheet at a time, driven from Logica's plain script.
type SheetOptions = { title: string; html: string; closeText: string; onClose?: () => void };
let sheet: SheetOptions | null = null;
const listeners = new Set<() => void>();
const setSheet = (next: SheetOptions | null) => { sheet = next; listeners.forEach((l) => l()); };

function SheetBridge() {
  const current = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => sheet);
  if (!current) return null;
  const close = () => { current.onClose?.(); setSheet(null); };
  return (
    <BottomSheet open title={current.title} detents={[0.78, 0.94]} onOpenChange={(open) => { if (!open) close(); }}>
      <div dangerouslySetInnerHTML={{ __html: current.html }} />
      <BottomSheetClose asChild><button type="button" className="btn go" style={{ width: "100%" }}>{current.closeText}</button></BottomSheetClose>
    </BottomSheet>
  );
}

const host = document.createElement("div");
host.className = "arc-ui";
host.id = "arc-ui-host"; // the bottom sheet portals into it, so it keeps the scoped Arc tokens
document.body.appendChild(host);
createRoot(host).render(
  <ToastStackProvider duration={4500}>
    <ToastBridge />
    <SheetBridge />
    <ToastStack position="bottom-center" label="Notifications" />
  </ToastStackProvider>,
);

const counters = new WeakMap<HTMLElement, ReturnType<typeof createRoot>>();

window.LogicaUI = {
  toast(options) {
    if (toastApi) toastApi.toast(options);
    else pending.push(options);
  },
  sheet: setSheet,
  counter(el, value, suffix = "") {
    let root = counters.get(el);
    if (!root) {
      el.textContent = "";
      el.classList.add("arc-ui");
      root = createRoot(el);
      counters.set(el, root);
    }
    root.render(<AnimatedCounter value={value} suffix={suffix} />);
  },
};

declare global {
  interface Window {
    LogicaUI: {
      toast(options: ToastOptions): void;
      counter(el: HTMLElement, value: number, suffix?: string): void;
      sheet(options: SheetOptions | null): void;
    };
  }
}
