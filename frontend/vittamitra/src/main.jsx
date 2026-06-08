import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AiAssistant from "./AiAssistant";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AiAssistant />
  </StrictMode>,
);
