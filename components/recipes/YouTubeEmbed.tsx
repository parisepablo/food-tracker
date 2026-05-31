"use client";

import { getYouTubeVideoId, getYouTubeEmbedUrl } from "@/lib/utils/youtube";

interface YouTubeEmbedProps {
  url: string | null | undefined;
  title?: string;
}

export function YouTubeEmbed({ url, title = "YouTube video" }: YouTubeEmbedProps) {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return (
      <div className="aspect-video w-full rounded-lg border bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">URL de YouTube no válida</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border">
      <div className="relative aspect-video w-full">
        <iframe
          src={getYouTubeEmbedUrl(videoId)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
