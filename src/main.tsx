import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { useStore } from "./lib/store";

useStore.getState().init();

createRoot(document.getElementById("root")!).render(<App />);
