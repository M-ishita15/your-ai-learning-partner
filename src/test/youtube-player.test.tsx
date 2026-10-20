import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";

afterEach(() => {
  cleanup();
  delete window.YT;
  delete window.onYouTubeIframeAPIReady;
  document.querySelector('script[src="https://www.youtube.com/iframe_api"]')?.remove();
});

describe("YouTube player readiness", () => {
  function setup(start = 210) {
    const instances: Array<{ ready: () => void; seekTo: ReturnType<typeof vi.fn>; playVideo: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn>; mount: HTMLElement }> = [];
    const Constructor: NonNullable<Window["YT"]>["Player"] = class {
      destroy = vi.fn();
      constructor(mount: HTMLElement, options: Parameters<InstanceType<typeof Constructor>["configure"]>[0]) {
        const seekTo = vi.fn(), playVideo = vi.fn();
        instances.push({ mount, destroy: this.destroy, seekTo, playVideo, ready: () => options.events.onReady({ target: { seekTo, playVideo } }) });
      }
      configure(_options: { events: { onReady: (event: { target: { seekTo: ReturnType<typeof vi.fn>; playVideo: ReturnType<typeof vi.fn> } }) => void } }) {}
    };
    window.YT = { Player: Constructor };
    let controls: ReturnType<typeof useYouTubePlayer> | undefined;
    function Harness({ time }: { time: number }) {
      controls = useYouTubePlayer("lecture", time);
      return <div ref={controls.host} />;
    }
    const rendered = render(<StrictMode><Harness time={start} /></StrictMode>);
    return { instances, rendered, seek: (seconds: number) => controls?.seek(seconds), changeTime: (time: number) => rendered.rerender(<StrictMode><Harness time={time} /></StrictMode>) };
  }

  it("applies the initial URL timestamp only after iframe readiness", () => {
    const { instances } = setup(210);
    const current = instances.at(-1);
    expect(current?.seekTo).not.toHaveBeenCalled();
    act(() => current?.ready());
    expect(current?.seekTo).toHaveBeenCalledWith(210, true);
    expect(current?.playVideo).not.toHaveBeenCalled();
  });

  it("queues the latest marker click before seekTo exists", () => {
    const { instances, seek } = setup();
    const current = instances.at(-1);
    act(() => { seek(210); seek(650); });
    expect(current?.seekTo).not.toHaveBeenCalled();
    act(() => current?.ready());
    expect(current?.seekTo).toHaveBeenCalledExactlyOnceWith(650, true);
    expect(current?.playVideo).toHaveBeenCalledOnce();
  });

  it("seeks changed URL timestamps after readiness without autoplay", () => {
    const { instances, changeTime } = setup();
    const current = instances.at(-1);
    act(() => current?.ready());
    changeTime(240);
    expect(current?.seekTo).toHaveBeenLastCalledWith(240, true);
    expect(current?.playVideo).not.toHaveBeenCalled();
  });

  it("ignores readiness from a destroyed Strict Mode instance", () => {
    const { instances, rendered } = setup();
    const old = instances[0], current = instances.at(-1);
    expect(old?.destroy).toHaveBeenCalledOnce();
    expect(current?.mount.isConnected).toBe(true);
    act(() => old?.ready());
    expect(old?.seekTo).not.toHaveBeenCalled();
    rendered.unmount();
    act(() => current?.ready());
    expect(current?.seekTo).not.toHaveBeenCalled();
  });
});