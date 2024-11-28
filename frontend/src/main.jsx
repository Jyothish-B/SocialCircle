import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./providers/theme-provider";
import { ReactQueryProvider } from "./providers/react-query-provider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ReactQueryProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </ReactQueryProvider>
  </StrictMode>
);
