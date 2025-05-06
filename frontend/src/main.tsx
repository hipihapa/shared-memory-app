import { createRoot } from "react-dom/client";
import Root from "./routes/root";

createRoot(document.getElementById("root")!).render(
  <>
    <div className="font-poppins">
      <Root />
    </div>
  </>
);
