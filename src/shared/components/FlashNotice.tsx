import { useEffect, useState } from "react";
import { consumeFlashNotice, getFlashEventName } from "../utils/flash";

export function FlashNotice() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: number | null = null;

    function show(nextMessage: string) {
      setMessage(nextMessage);

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        setMessage(null);
        timeoutId = null;
      }, 2000);
    }

    const initialMessage = consumeFlashNotice();
    if (initialMessage) {
      show(initialMessage);
    }

    function handleFlash(event: Event) {
      const customEvent = event as CustomEvent<string>;
      const persistedMessage = consumeFlashNotice();

      if (persistedMessage ?? customEvent.detail) {
        show(persistedMessage ?? customEvent.detail);
      }
    }

    window.addEventListener(getFlashEventName(), handleFlash as EventListener);

    return () => {
      window.removeEventListener(getFlashEventName(), handleFlash as EventListener);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!message) {
    return null;
  }

  return <p className="flash-notice">{message}</p>;
}
