"use client";

import { useEffect, useState } from "react";

/** Evenimentul `beforeinstallprompt` (non-standard, doar Chromium). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

const DISMISS_KEY = "install-prompt-dismissed";

/** Buton de instalare PWA: prompt nativ pe Android/Chrome, instrucțiuni pe iOS.
 *  Se ascunde dacă aplicația e deja instalată sau dacă userul a închis bannerul. */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // localStorage indisponibil — continuăm oricum
    }
    if (dismissed) return;

    // Android/Chrome: capturăm promptul ca să-l declanșăm noi la click.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setPlatform("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS nu emite `beforeinstallprompt` — detectăm mediul (sistem extern) și
    // afișăm butonul cu pași manuali. Set unic la montare, nu buclă de randări.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isIos()) setPlatform("ios");

    const onInstalled = () => setPlatform(null);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const close = () => {
    setPlatform(null);
    setDeferred(null);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignorăm
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setPlatform(null);
  };

  if (platform === null) return null;

  return (
    <div className="tint-primary flex flex-col gap-2 rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="text-lg">📲</span>
          Instalează aplicația
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Închide"
          className="shrink-0 rounded-lg px-2 text-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {platform === "android" ? (
        <>
          <p className="text-sm text-muted">
            Adaug-o pe ecranul principal ca să o deschizi ca pe o aplicație reală.
          </p>
          <button
            type="button"
            onClick={install}
            className="mt-1 self-start rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Instalează
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setShowIosHelp((s) => !s)}
            className="self-start text-sm font-semibold text-primary underline"
          >
            {showIosHelp ? "Ascunde pașii" : "Cum o instalez pe iPhone?"}
          </button>
          {showIosHelp ? (
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-muted">
              <li>
                Apasă butonul <span className="font-semibold text-foreground">Share</span>{" "}
                (pătrat cu săgeată în sus), în bara Safari.
              </li>
              <li>
                Alege{" "}
                <span className="font-semibold text-foreground">
                  {"„Add to Home Screen / Adaugă la ecranul principal”."}
                </span>
              </li>
              <li>
                Confirmă cu {"„Add”"} — iconița apare pe ecranul principal.
              </li>
            </ol>
          ) : null}
        </>
      )}
    </div>
  );
}
