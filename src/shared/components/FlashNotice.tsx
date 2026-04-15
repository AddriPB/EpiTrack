import { useEffect, useState } from "react";

export function FlashNotice() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const flash = window.sessionStorage.getItem("epitrack-flash");

    if (!flash) {
      return;
    }

    setMessage(flash);
    window.sessionStorage.removeItem("epitrack-flash");
  }, []);

  if (!message) {
    return null;
  }

  return <p className="flash-notice">{message}</p>;
}
