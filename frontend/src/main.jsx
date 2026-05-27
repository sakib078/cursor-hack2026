import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ChatRoom from "./ChatRoom.jsx";
import Landing from "./Landing.jsx";
import "./theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Steps 3-4 (this app). */}
        <Route path="/chat/:sessionId" element={<ChatRoom />} />
        {/*
          "/" is the upload page owned by teammates (Steps 1-2).
          Until that lands, this dev placeholder lets us seed + enter a chat.
        */}
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
