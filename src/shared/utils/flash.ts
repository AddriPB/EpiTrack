const FLASH_KEY = "epitrack-flash";
const FLASH_EVENT = "epitrack:flash";

export function pushFlashNotice(message: string) {
  window.sessionStorage.setItem(FLASH_KEY, message);
  window.dispatchEvent(new CustomEvent(FLASH_EVENT, { detail: message }));
}

export function consumeFlashNotice() {
  const message = window.sessionStorage.getItem(FLASH_KEY);

  if (!message) {
    return null;
  }

  window.sessionStorage.removeItem(FLASH_KEY);
  return message;
}

export function getFlashEventName() {
  return FLASH_EVENT;
}
