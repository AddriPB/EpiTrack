const UPDATE_EVENT = "epitrack:update-available";

let pendingRegistration: ServiceWorkerRegistration | null = null;
let refreshOnControllerChange = false;
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

function announceUpdate(registration: ServiceWorkerRegistration) {
  pendingRegistration = registration;
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function watchInstallingWorker(worker: ServiceWorker, registration: ServiceWorkerRegistration) {
  worker.addEventListener("statechange", () => {
    if (worker.state === "installed" && navigator.serviceWorker.controller) {
      announceUpdate(registration);
    }
  });
}

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
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
    });
  }
}

export function getServiceWorkerUpdateEventName() {
  return UPDATE_EVENT;
}

export function hasPendingServiceWorkerUpdate() {
  return Boolean(pendingRegistration?.waiting);
}

export async function checkForServiceWorkerUpdate() {
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
  if (!pendingRegistration?.waiting) {
    window.location.reload();
    return;
  }

  refreshOnControllerChange = true;
  pendingRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
}
