import React, { useEffect, useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className: string;
  loading?: "lazy" | "eager";
}

const LazyImage: React.FC<LazyImageProps> = React.memo(
  ({ src, alt, className, loading = "lazy" }: LazyImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(loading === "eager");
    const imgRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (loading === "eager") {
        setIsInView(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );

      const currentImgRef = imgRef.current;

      if (currentImgRef) {
        observer.observe(currentImgRef);
      }

      return () => {
        if (currentImgRef) {
          observer.unobserve(currentImgRef);
        }
      };
    }, [loading]);

    return (
      <div ref={imgRef} className={`${className} bg-gray-300`}>
        {(isInView || loading === "eager") && (
          <img
            src={src}
            alt={alt}
            className={`${className} ${
              isLoaded ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300`}
            onLoad={() => setIsLoaded(true)}
            loading={loading}
          />
        )}
      </div>
    );
  },
);

export default LazyImage;
