"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { META_PIXEL_ID } from "@/lib/metaPixel";

const CONSENT_KEY = "pattern-spotter:cookie-consent";

export default function MetaPixel() {
  const [consent, setConsent] = useState<"accepted" | "declined" | "pending">("pending");

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted" || stored === "declined") {
      setConsent(stored);
    }
  }, []);

  function accept() {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    setConsent("accepted");
  }

  function decline() {
    window.localStorage.setItem(CONSENT_KEY, "declined");
    setConsent("declined");
  }

  return (
    <>
      {consent === "accepted" && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {consent === "pending" && (
        <div className="fixed bottom-0 left-0 right-0 bg-dark text-cream px-6 py-4 flex flex-col sm:flex-row items-center gap-4 z-50">
          <p className="text-sm flex-1">
            We use cookies for advertising analytics (Meta Pixel), so we can
            measure how our ads perform. You can decline and still use the
            site normally.
          </p>
          <div className="flex gap-3 flex-shrink-0">
            <button onClick={decline} className="text-sm underline text-cream/80">
              Decline
            </button>
            <button
              onClick={accept}
              className="bg-terracotta text-white text-sm font-bold uppercase tracking-wider px-5 py-2 rounded-[6px]"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
}
