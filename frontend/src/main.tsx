import { createRoot } from "react-dom/client";
import Root from "./routes/root";


import { Provider } from "react-redux";
import { store } from "./store";

createRoot(document.getElementById("root")!).render(
  <>
    <div className="font-poppins">
      <Provider store={store}>
      <Root />
      </Provider>
    </div>
  </>
);
