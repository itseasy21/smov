import React, { useEffect, useRef } from "react";

interface AdProps {
  type: "468" | "320" | "native4:1";
  className?: string;
}

const adConfigs = {
  "468": {
    key: "60796a12a5a6b502f20b09d8c752c7b6",
    width: 468,
    height: 60,
  },
  "320": {
    key: "b5efe5cd80cbded219f78a8ef9e3dab2",
    width: 320,
    height: 50,
  },
  "native4:1": {
    key: "cb5c0b2512af0c3221cbd699be5d18fe",
    isNative: true,
  },
};

export function Ad({ type, className }: AdProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const config = adConfigs[type];
    if (!config) return;

    const currentAdRef = adRef.current;

    const script = document.createElement("script");
    script.async = true;
    script.type = "text/javascript";

    if ("isNative" in config) {
      script.src = `//pl24478805.cpmrevenuegate.com/${config.key}/invoke.js`;
      script.dataset.cfasync = "false";
    } else {
      const atOptions = {
        key: config.key,
        format: "iframe",
        height: config.height,
        width: config.width,
        params: {},
      };
      script.innerHTML = `atOptions = ${JSON.stringify(atOptions)};`;

      const invokeScript = document.createElement("script");
      invokeScript.src = `//www.topcreativeformat.com/${config.key}/invoke.js`;
      currentAdRef?.appendChild(invokeScript);
    }

    currentAdRef?.appendChild(script);

    return () => {
      if (currentAdRef) {
        currentAdRef.innerHTML = "";
      }
    };
  }, [type]);

  return (
    <div
      ref={adRef}
      className={className}
      id={`container-${adConfigs[type].key}`}
    >
      {/* Ad will be inserted here */}
    </div>
  );
}
