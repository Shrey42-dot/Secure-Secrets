import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import CreateSecret from "./pages/CreateSecret";
import ViewSecret from "./pages/ViewSecret";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<CreateSecret />} />
          <Route path="s/:token" element={<ViewSecret />} />
          {/* other routes */}
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
