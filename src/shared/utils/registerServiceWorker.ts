const UPDATE_EVENT = "epitrack:update-available";
const UPDATE_PENDING_KEY = "epitrack:update-pending";

let pendingRegistration: ServiceWorkerRegistration | null = null;
let refreshOnControllerChange = false;
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
let serviceWorkerRegistered = false;

function announceUpdate(registration: ServiceWorkerRegistration) {
  pendingRegistration = registration;
  window.sessionStorage.setItem(UPDATE_PENDING_KEY, "1");
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function watchInstallingWorker(worker: ServiceWorker, registration: ServiceWorkerRegistration) {
  worker.addEventListener("statechange", () => {
    if (worker.state === "installed" && navigator.serviceWorker.controller) {
      announceUpdate(registration);
    }
  });
}

function registerNow() {
  if (!("serviceWorker" in navigator) || serviceWorkerRegistered) {
    return;
  }

  serviceWorkerRegistered = true;
  registrationPromise = navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`)
    .then((registration) => {
      if (registration.waiting) {
        announceUpdate(registration);
      }

      registration.addEventListener("updatefound", () => {
        if (registration.installing) {
          watchInstallingWorker(registration.installing, registration);
        }
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshOnControllerChange) {
          window.location.reload();
        }
      });

      return registration;
    })
    .catch(() => {
      return null;
    });
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (document.readyState === "complete") {
    registerNow();
    return;
  }

  window.addEventListener("load", registerNow, { once: true });
}

export function getServiceWorkerUpdateEventName() {
  return UPDATE_EVENT;
}

export function hasPendingServiceWorkerUpdate() {
  return Boolean(
    pendingRegistration?.waiting || window.sessionStorage.getItem(UPDATE_PENDING_KEY) === "1"
  );
}

export async function checkForServiceWorkerUpdate() {
  if (!registrationPromise && "serviceWorker" in navigator) {
    registrationPromise = navigator.serviceWorker.getRegistration().then((registration) => registration ?? null);
  }

  const registration = await registrationPromise;

  if (!registration) {
    return false;
  }

  await registration.update();

  if (registration.waiting) {
    announceUpdate(registration);
    return true;
  }

  return false;
}

export function applyServiceWorkerUpdate() {
  window.sessionStorage.removeItem(UPDATE_PENDING_KEY);

  if (!pendingRegistration?.waiting) {
    window.location.reload();
    return;
  }

  refreshOnControllerChange = true;
  pendingRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
}
