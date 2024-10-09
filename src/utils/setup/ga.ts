import { useEffect } from "react";

import { GA_ID } from "@/setup/constants";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const useGA4 = (autoPageview = false) => {
  useEffect(() => {
    if (GA_ID) {
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      script.async = true;

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args) {
        window.dataLayer?.push(args);
      };
      window.gtag("js", new Date());
      window.gtag("config", GA_ID, {
        send_page_view: autoPageview, // Enable/disable automatic pageviews
      });

      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [autoPageview]);

  const sendPageView = (path: string) => {
    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_path: path,
      });
    }
  };

  const sendEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (window.gtag) {
      window.gtag("event", eventName, eventParams);
    }
  };

  return { sendPageView, sendEvent };
};
