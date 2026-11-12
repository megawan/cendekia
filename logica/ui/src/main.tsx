import { useRef, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { ReorderableList } from "./components/arc/reorderable-list/reorderable-list";
import { Stepper } from "./components/arc/stepper/stepper";
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
const setSheet = (next: SheetOptions | null) => { sheet = next; detents = next ? detentsFor(next.html) : detents; listeners.forEach((l) => l()); };

// The sheet is as tall as its largest detent, so a short tutorial on a tall screen would sit in a sea of white.
// Measure the content at the sheet's width and size the sheet to it; only content taller than the screen gets two detents.
let detents = [0.94];
function detentsFor(html: string) {
  const probe = document.createElement("div");
  probe.style.cssText = `position:fixed;left:0;top:0;visibility:hidden;box-sizing:border-box;padding:0 20px;width:${Math.min(window.innerWidth, 576)}px`;
  probe.innerHTML = `${html}<div style="height:64px"></div>`;
  document.body.appendChild(probe);
  const content = probe.offsetHeight;
  probe.remove();
  const fraction = (content + 120) / window.innerHeight; // 120px: grabber, title and padding
  return fraction >= 0.94 ? [0.6, 0.94] : [Math.max(fraction, 0.3)];
}

function SheetBridge() {
  const now = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => sheet);
  // Keep the last content while the sheet slides away, so closing it animates instead of vanishing.
  const shown = useRef<SheetOptions | null>(null);
  if (now) shown.current = now;
  const current = shown.current;
  if (!current) return null;
  const close = () => { current.onClose?.(); setSheet(null); };
  return (
    <BottomSheet open={!!now} title={current.title} detents={detents} onOpenChange={(open) => { if (!open && now) close(); }}>
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

// One React root per element Logica hands over; its content is replaced on every call.
const roots = new WeakMap<HTMLElement, ReturnType<typeof createRoot>>();
function rootFor(el: HTMLElement) {
  let root = roots.get(el);
  if (!root) {
    el.textContent = "";
    el.classList.add("arc-ui");
    root = createRoot(el);
    roots.set(el, root);
  }
  return root;
}

window.LogicaUI = {
  toast(options) {
    if (toastApi) toastApi.toast(options);
    else pending.push(options);
  },
  sheet: setSheet,
  counter(el, value, suffix = "") {
    rootFor(el).render(<AnimatedCounter value={value} suffix={suffix} />);
  },
  progress(el, total, done) {
    const steps = Array.from({ length: total }, (_, k) => ({ id: `q${k + 1}`, label: `Question ${k + 1}` }));
    rootFor(el).render(<Stepper steps={steps} current={done} compact label="Questions" completeLabel="All done!" />);
  },
  reorder(el, { items, hinted = [], label, onReorder }) {
    rootFor(el).render(
      <ReorderableList label={label} hinted={hinted} items={items.map((id) => ({ id, title: id }))} onReorder={(next) => onReorder(next.map((i) => i.id))} />,
    );
  },
};

declare global {
  interface Window {
    LogicaUI: {
      toast(options: ToastOptions): void;
      counter(el: HTMLElement, value: number, suffix?: string): void;
      sheet(options: SheetOptions | null): void;
      progress(el: HTMLElement, total: number, done: number): void;
      reorder(el: HTMLElement, options: { items: string[]; hinted?: string[]; label?: string; onReorder(order: string[]): void }): void;
    };
  }
}
