const UPDATE_EVENT = "epitrack:update-available";

let pendingRegistration: ServiceWorkerRegistration | null = null;
let refreshOnControllerChange = false;

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
      navigator.serviceWorker
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
        })
        .catch(() => {
          return undefined;
        });
    });
  }
}

export function getServiceWorkerUpdateEventName() {
  return UPDATE_EVENT;
}

export function applyServiceWorkerUpdate() {
  if (!pendingRegistration?.waiting) {
    window.location.reload();
    return;
  }

  refreshOnControllerChange = true;
  pendingRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
}
