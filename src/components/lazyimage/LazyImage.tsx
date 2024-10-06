import React, { useEffect, useState } from "react";

const LazyImage: React.FC<{ src: string; alt: string; className: string }> =
  React.memo(
    ({
      src,
      alt,
      className,
    }: {
      src: string;
      alt: string;
      className: string;
    }) => {
      const [isLoaded, setIsLoaded] = useState(false);
      const [isInView, setIsInView] = useState(false);
      const imgRef = React.useRef<HTMLDivElement>(null);

      useEffect(() => {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          },
          { threshold: 0.1 },
        );

        const currentImgRef = imgRef.current; // Capture the current value

        if (currentImgRef) {
          observer.observe(currentImgRef);
        }

        return () => {
          if (currentImgRef) {
            observer.unobserve(currentImgRef);
          }
        };
      }, []);

      return (
        <div ref={imgRef} className={`${className} bg-gray-300`}>
          {isInView && (
            <img
              src={src}
              alt={alt}
              className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
              onLoad={() => setIsLoaded(true)}
            />
          )}
        </div>
      );
    },
  );

export default LazyImage;
