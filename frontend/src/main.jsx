import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import CreateSecret from "./pages/CreateSecret.jsx";
import ViewSecret from "./pages/ViewSecret.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<CreateSecret />} />
          <Route path="s/:token" element={<ViewSecret />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
