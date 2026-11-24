type HandTrackerResource = {
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): Promise<void> | void;
};

/** One owner for the WASM tracker; close only after its current frame settles. */
export function createBagCameraSession(tracker: HandTrackerResource) {
  let stopped = false;
  let pending: Promise<void> | null = null;
  let closing: Promise<void> | null = null;

  return {
    send(input: { image: HTMLVideoElement }): Promise<void> {
      if (stopped) return Promise.resolve();
      if (pending) return pending;
      const frame = Promise.resolve().then(() => {
        if (!stopped) return tracker.send(input);
      });
      pending = frame;
      const settled = () => {
        if (pending === frame) pending = null;
      };
      void frame.then(settled, settled);
      return frame;
    },
    stop(): Promise<void> {
      if (closing) return closing;
      stopped = true;
      const frame = pending;
      closing = (async () => {
        try {
          await frame;
        } catch {
          /* A failed frame still needs cleanup. */
        }
        try {
          await tracker.close();
        } catch {
          // MediaPipe can throw synchronously if a failed initialization already
          // deleted its WASM instance. Never let cleanup crash the React tree.
        }
      })();
      return closing;
    },
  };
}
