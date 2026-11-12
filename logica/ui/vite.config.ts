import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// One classic-script bundle (logica-ui.js + logica-ui.css) that index.html loads with plain <script>/<link>.
export default defineConfig({
  plugins: [react()],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "../ui-dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: { entry: "src/main.tsx", name: "LogicaUIBundle", formats: ["iife"], fileName: () => "logica-ui.js", cssFileName: "logica-ui" },
  },
});
