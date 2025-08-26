import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; 
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/:lang" element={<App />} /> {/* Route with path parameter */}
        <Route path="/" element={<Navigate to="/es" />} /> {/* Redirect to default language */}
      </Routes>
    </BrowserRouter>
  </StrictMode>
);