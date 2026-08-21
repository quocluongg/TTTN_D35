// Loader cho Google Identity Services (GIS) - dùng để lấy Google ID token phía client.
// ID token sau đó gửi lên backend /auth/google-login để verify và cấp JWT của hệ thống.

type GoogleAccounts = any;

let scriptPromise: Promise<GoogleAccounts> | null = null;

export function loadGoogleScript(): Promise<GoogleAccounts> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Chỉ dùng loadGoogleScript ở phía client"));
  }

  if ((window as any).google?.accounts?.id) {
    return Promise.resolve((window as any).google);
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<GoogleAccounts>((resolve, reject) => {
    const existing = document.getElementById("google-gsi-script");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).google));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = () => reject(new Error("Không thể tải Google Identity Services"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
}
