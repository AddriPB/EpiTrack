import { useEffect, useState } from "react";
import {
  applyServiceWorkerUpdate,
  getServiceWorkerUpdateEventName
} from "../utils/registerServiceWorker";

export function UpdateNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function showNotice() {
      setVisible(true);
    }

    window.addEventListener(getServiceWorkerUpdateEventName(), showNotice as EventListener);

    return () => {
      window.removeEventListener(getServiceWorkerUpdateEventName(), showNotice as EventListener);
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
