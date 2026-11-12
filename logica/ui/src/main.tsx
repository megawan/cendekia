import { createRoot } from "react-dom/client";
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

const host = document.createElement("div");
host.className = "arc-ui";
document.body.appendChild(host);
createRoot(host).render(
  <ToastStackProvider duration={4500}>
    <ToastBridge />
    <ToastStack position="bottom-center" label="Notifications" />
  </ToastStackProvider>,
);

const counters = new WeakMap<HTMLElement, ReturnType<typeof createRoot>>();

window.LogicaUI = {
  toast(options) {
    if (toastApi) toastApi.toast(options);
    else pending.push(options);
  },
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
    };
  }
}
