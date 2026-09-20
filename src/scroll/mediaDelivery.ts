// Sites' static delivery currently ignores HTTP byte ranges. Keep ordinary
// range-capable previews native; the attribute supports a faithful host fixture.
let registration: Promise<boolean> | undefined;
export function prepareMediaDelivery(): Promise<boolean> {
  if (
    !location.hostname.endsWith(".chatgpt.site") &&
    !document.documentElement.hasAttribute("data-range-delivery")
  )
    return Promise.resolve(true);
  if (!("serviceWorker" in navigator)) return Promise.resolve(false);
  return (registration ??= new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (success: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controlled,
      );
      resolve(success);
    };
    const controlled = () => {
      if (
        navigator.serviceWorker.controller?.scriptURL.endsWith(
          "/media-delivery-worker.js",
        )
      )
        finish(true);
    };
    const timer = window.setTimeout(() => finish(false), 5000);
    navigator.serviceWorker.addEventListener("controllerchange", controlled);
    navigator.serviceWorker
      .register("/media-delivery-worker.js")
      .then(controlled)
      .catch(() => finish(false));
  }));
}
