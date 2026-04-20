import { useEffect, useState } from "react";
import {
  applyServiceWorkerUpdate,
  checkForServiceWorkerUpdate,
  hasPendingServiceWorkerUpdate,
  getServiceWorkerUpdateEventName
} from "../utils/registerServiceWorker";

export function UpdateNotice() {
  const [visible, setVisible] = useState(() => hasPendingServiceWorkerUpdate());

  useEffect(() => {
    function showNotice() {
      setVisible(true);
    }

    async function refreshUpdateStatus() {
      const hasUpdate = await checkForServiceWorkerUpdate();

      if (hasUpdate) {
        setVisible(true);
      }
    }

    void refreshUpdateStatus();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshUpdateStatus();
      }
    }

    function handleWindowFocus() {
      void refreshUpdateStatus();
    }

    const intervalId = window.setInterval(() => {
      void refreshUpdateStatus();
    }, 30000);

    window.addEventListener(getServiceWorkerUpdateEventName(), showNotice as EventListener);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener(getServiceWorkerUpdateEventName(), showNotice as EventListener);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.clearInterval(intervalId);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="update-notice" role="status" aria-live="polite">
      <span>Nouvelle version disponible</span>
      <button
        type="button"
        className="update-notice__action"
        onClick={() => {
          setVisible(false);
          applyServiceWorkerUpdate();
        }}
      >
        Recharger
      </button>
    </div>
  );
}
