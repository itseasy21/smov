import React, { memo, useCallback, useState } from "react";

interface YouTubeEmbedProps {
  videoId: string;
  width?: string;
  height?: string;
  imgSize?:
    | "default"
    | "hqdefault"
    | "mqdefault"
    | "sddefault"
    | "maxresdefault";
}

export const YouTubeEmbed = memo((props: YouTubeEmbedProps) => {
  const {
    videoId,
    width = "100%",
    height = "100%",
    imgSize = "default",
  } = props;
  const [showVideo, setShowVideo] = useState(false);

  const handleClick = useCallback(() => {
    setShowVideo(true);
  }, []);

  if (showVideo) {
    return (
      <iframe
        width={width}
        height={height}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&showinfo=0`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full"
      />
    );
  }

  return (
    <div
      className="relative flex justify-center items-center bg-black bg-center bg-cover bg-no-repeat cursor-pointer"
      style={{
        backgroundImage: `url(https://img.youtube.com/vi/${videoId}/${imgSize}.jpg)`,
        width,
        height,
      }}
      onClick={handleClick}
    >
      <div className="relative h-15 w-24 bg-black bg-opacity-70 rounded hover:bg-opacity-90 transition-colors duration-300 group">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/3 -translate-y-1/2 border-t-transparent border-b-transparent border-l-white border-l-[20px] border-y-[12.5px]" />
      </div>
    </div>
  );
});
