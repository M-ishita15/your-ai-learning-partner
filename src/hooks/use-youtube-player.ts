import { useCallback, useEffect, useRef } from "react";

type YouTubePlayer = {
  destroy?: () => void;
  getPlayerState?: () => number;
  getCurrentTime?: () => number;
  seekTo?: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo?: () => void;
};
type PlayerOptions = {
  videoId: string;
  playerVars: { rel: number; start: number };
  events: { onReady: (event: { target: YouTubePlayer }) => void };
};

declare global {
  interface Window {
    YT?: { Player: new (element: HTMLElement, options: PlayerOptions) => YouTubePlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function useYouTubePlayer(videoId: string | null | undefined, start: number) {
  const host = useRef<HTMLDivElement>(null);
  // Only expose the player to polling after the iframe's onReady event.
  const player = useRef<YouTubePlayer | null>(null);
  const pending = useRef<{ seconds: number; play: boolean } | null>(null);
  const latestStart = useRef(start);

  const seek = useCallback((seconds: number, play = true) => {
    const readyPlayer = player.current;
    if (typeof readyPlayer?.seekTo !== "function") {
      pending.current = { seconds, play };
      return;
    }
    readyPlayer.seekTo(seconds, true);
    if (play) readyPlayer.playVideo?.();
  }, []);

  useEffect(() => {
    latestStart.current = start;
    seek(start, false);
  }, [start, seek]);

  useEffect(() => {
    if (!videoId) return;
    let active = true;
    let instance: YouTubePlayer | null = null;
    const make = () => {
      const Constructor = window.YT?.Player;
      const container = host.current;
      if (!active || instance || !Constructor || !container) return;
      // YouTube replaces its mount node. Keep React's host intact for remounts.
      const mount = document.createElement("div");
      mount.className = "h-full w-full";
      container.replaceChildren(mount);
      instance = new Constructor(mount, {
        videoId,
        playerVars: { rel: 0, start: latestStart.current },
        events: {
          onReady: ({ target }) => {
            if (!active) return;
            player.current = target;
            const request = pending.current;
            pending.current = null;
            if (request) seek(request.seconds, request.play);
          },
        },
      });
    };
    const previousReady = window.onYouTubeIframeAPIReady;
    const apiReady = () => { previousReady?.(); make(); };
    if (window.YT?.Player) make();
    else {
      window.onYouTubeIframeAPIReady = apiReady;
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
    }
    return () => {
      active = false;
      player.current = null;
      instance?.destroy?.();
      if (window.onYouTubeIframeAPIReady === apiReady) {
        if (previousReady) window.onYouTubeIframeAPIReady = previousReady;
        else delete window.onYouTubeIframeAPIReady;
      }
    };
  }, [videoId, seek]);

  return { host, player, seek };
}