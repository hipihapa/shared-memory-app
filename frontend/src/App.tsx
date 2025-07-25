import { StrictMode } from "react";
import { createRoot } from "react-dom/client";


import "./App.css";
import Root from "./routes/root";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);

