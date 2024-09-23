import { useCallback, useMemo } from "react";

import { Icon, Icons } from "@/components/Icon";
import { useBookmarkStore } from "@/stores/bookmarks";
import { PlayerMeta } from "@/stores/player/slices/source";
import { MediaItem } from "@/utils/mediaTypes";

import { Button } from "../buttons/Button";
import { IconPatch } from "../buttons/IconPatch";

interface MediaBookmarkProps {
  media: MediaItem;
  showWording?: boolean;
}

export function MediaBookmarkButton({
  media,
  showWording = false,
}: MediaBookmarkProps) {
  const addBookmark = useBookmarkStore((s) => s.addBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const meta: PlayerMeta | undefined = useMemo(() => {
    return media.year !== undefined
      ? {
          type: media.type,
          title: media.title,
          tmdbId: media.id,
          releaseYear: media.year,
          poster: media.poster,
        }
      : undefined;
  }, [media]);
  const isBookmarked = !!bookmarks[meta?.tmdbId ?? ""];

  const toggleBookmark = useCallback(() => {
    if (!meta) return;
    if (isBookmarked) removeBookmark(meta.tmdbId);
    else addBookmark(meta);
  }, [isBookmarked, meta, addBookmark, removeBookmark]);

  const buttonOpacityClass =
    media.year === undefined ? "hover:opacity-100" : "hover:opacity-95";

  if (showWording) {
    return (
      <Button
        theme="secondary"
        onClick={toggleBookmark}
        className={`${buttonOpacityClass} w-full sm:w-auto bg-primary-main hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-full transition duration-300 text-lg`}
      >
        {isBookmarked ? (
          <Icon icon={Icons.BOOKMARK} className="mr-2" />
        ) : (
          <Icon icon={Icons.BOOKMARK_OUTLINE} className="mr-2" />
        )}
        <span className="text-sm px-1">
          {isBookmarked ? "Remove from Watchlist" : "Save to Watchlist"}
        </span>
      </Button>
    );
  }

  return (
    <IconPatch
      onClick={toggleBookmark}
      icon={isBookmarked ? Icons.BOOKMARK : Icons.BOOKMARK_OUTLINE}
      className={`${buttonOpacityClass} p-2 opacity-75 transition-opacity transition-transform duration-300 hover:scale-110 hover:cursor-pointer`}
    />
  );
}
