import type { RefObject } from "react";
import type {
  QuakeInput,
  QuakeSnapshot,
  QuakeState,
} from "@/lib/games/sigapBencana";

export type QuakeBridge = {
  inputRef: RefObject<QuakeInput>;
  stateRef: RefObject<QuakeState | null>;
  reducedMotionRef: RefObject<boolean>;
  shakeEnabledRef: RefObject<boolean>;
  onReady: () => void;
  onUpdate: (snapshot: QuakeSnapshot) => void;
  onQuestion: (id: string) => void;
  onFinish: (snapshot: QuakeSnapshot) => void;
};
