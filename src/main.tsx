
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import LandingPage from "./components/LandingPage";
  import "./index.css";

  const pathname = window.location.pathname;
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");

  createRoot(document.getElementById("root")!).render(
    isAppRoute ? <App /> : <LandingPage />
  );
  