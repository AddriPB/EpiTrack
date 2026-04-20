import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./app/App";
import "./styles/global.css";
import { registerServiceWorker } from "./shared/utils/registerServiceWorker";
import { AuthProvider } from "./services/auth/AuthContext";
import { UpdateNotice } from "./shared/components/UpdateNotice";

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <UpdateNotice />
      <HashRouter>
        <App />
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>
);
