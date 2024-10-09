import { useCallback, useEffect, useRef, useState } from "react";

export function useIsMobile(horizontal?: boolean) {
  const [isMobile, setIsMobile] = useState(false);
  const isMobileCurrent = useRef(false);

  const onResize = useCallback(() => {
    const value = horizontal
      ? window.innerHeight < 600
      : window.innerWidth < 768;

    if (isMobileCurrent.current !== value) {
      isMobileCurrent.current = value;
      setIsMobile(value);
    }
  }, [horizontal]);

  useEffect(() => {
    // Initial check
    onResize();

    // Debounce function
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(onResize, 100);
    };

    window.addEventListener("resize", debouncedResize);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [onResize]);

  return { isMobile };
}
