"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
  type KeyboardEvent,
} from "react";
import type { QuakeInput } from "@/lib/games/sigapBencana";
type Control = "left" | "right" | "jump";
const keys: Record<string, Control> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  Space: "jump",
};

export function useQuakeControls(
  inputRef: RefObject<QuakeInput>,
  onEscape: () => void,
  onBlur: () => void,
) {
  const held = useRef(new Map<string, Control>());
  const pointers = useRef(new Map<number, Control>());
  const [pressed, setPressed] = useState({
    left: false,
    right: false,
    jump: false,
  });
  const sync = useCallback(() => {
    const values = [...held.current.values(), ...pointers.current.values()];
    const next = {
      left: values.includes("left"),
      right: values.includes("right"),
      jump: values.includes("jump"),
    };
    if (next.jump && !inputRef.current.jump) inputRef.current.jumpQueued = true;
    Object.assign(inputRef.current, next);
    setPressed(next);
  }, [inputRef]);
  const clear = useCallback(() => {
    held.current.clear();
    pointers.current.clear();
    Object.assign(inputRef.current, {
      left: false,
      right: false,
      jump: false,
      jumpQueued: false,
    });
    setPressed({ left: false, right: false, jump: false });
  }, [inputRef]);
  useEffect(() => {
    const down = (event: globalThis.KeyboardEvent) => {
      if (event.code === "Escape") {
        event.preventDefault();
        onEscape();
        return;
      }
      if (
        !inputRef.current.enabled ||
        !keys[event.code] ||
        (event.target as HTMLElement)?.closest(
          "button,a,input,textarea,select,[contenteditable=true]",
        )
      )
        return;
      event.preventDefault();
      held.current.set(event.code, keys[event.code]);
      sync();
    };
    const up = (event: globalThis.KeyboardEvent) => {
      if (keys[event.code]) {
        held.current.delete(event.code);
        sync();
      }
    };
    const blur = () => {
      clear();
      onBlur();
    };
    const hidden = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    window.addEventListener("pagehide", blur);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("pagehide", blur);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [inputRef, onEscape, onBlur, clear, sync]);
  function release(event: PointerEvent<HTMLButtonElement>) {
    const control = pointers.current.get(event.pointerId);
    pointers.current.delete(event.pointerId);
    if (control === "jump" && event.type !== "pointerup")
      inputRef.current.jumpQueued = false;
    sync();
  }
  const handlers = (control: Control) => ({
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      if (
        !inputRef.current.enabled ||
        (event.pointerType === "mouse" && event.button !== 0)
      )
        return;
      event.preventDefault();
      if (event.pointerType === "mouse")
        event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, control);
      sync();
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
    onContextMenu(event: React.MouseEvent) {
      event.preventDefault();
    },
    onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      if (!inputRef.current.enabled || !["Space", "Enter"].includes(event.code))
        return;
      event.preventDefault();
      held.current.set("button-" + control, control);
      sync();
    },
    onKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
      if (!["Space", "Enter"].includes(event.code)) return;
      event.preventDefault();
      held.current.delete("button-" + control);
      sync();
    },
    onBlur() {
      const keyboardHeld = held.current.delete("button-" + control);
      if (keyboardHeld && control === "jump")
        inputRef.current.jumpQueued = false;
      sync();
    },
  });
  return { pressed, clear, handlers };
}
