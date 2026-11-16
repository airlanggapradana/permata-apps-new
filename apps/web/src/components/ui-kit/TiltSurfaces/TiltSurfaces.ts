import { useEffect, useRef } from "react";
import type { MouseEvent, RefObject } from "react";

/**
 * Port React dari useTiltSurface (Vue). API sama: { onMouseMove, onMouseLeave }.
 *
 * Pasang handler di elemen pemicu (mis. pembungkus), dan isi targetRef dengan elemen
 * yang benar-benar dimiringkan (mis. kartu). Posisi kursor dihitung terhadap pembungkus,
 * bukan kartu yang sedang miring, jadi tidak berkedip di tepi.
 */
export type TiltOptions = {
    perspective?: number;
    rotate?: number;
    scale?: number;
    shineSelector?: string | null;
    shineSize?: number;
    shineBaseOpacity?: number;
    shineBoost?: number;
    shineTransparentAt?: number;
    resetDuration?: number;
    resetTiming?: string;
};

type FrameState = {
    rafId: number | null;
    clientX: number;
    clientY: number;
    hit: HTMLElement | null;
};

export function useTiltSurface(
    targetRef: RefObject<HTMLElement | null> | null = null,
    options: TiltOptions = {},
) {
    const {
        perspective = 780,
        rotate = 11,
        scale = 1.04,
        shineSelector = null,
        shineSize = 60,
        shineBaseOpacity = 0.14,
        shineBoost = 0.08,
        shineTransparentAt = 72,
        resetDuration = 420,
        resetTiming = "cubic-bezier(0.23, 1, 0.32, 1)",
    } = options;

    const rafState = useRef(new Map<HTMLElement, FrameState>());
    const leaveTimers = useRef(new Map<HTMLElement, number>());

    const resolveElement = (event: MouseEvent<HTMLElement>) =>
        targetRef?.current ?? event.currentTarget ?? null;

    const clearLeaveTimer = (el: HTMLElement) => {
        const t = leaveTimers.current.get(el);
        if (t === undefined) return;
        window.clearTimeout(t);
        leaveTimers.current.delete(el);
    };

    const cancelPendingFrame = (el: HTMLElement) => {
        const st = rafState.current.get(el);
        if (!st?.rafId) return;
        cancelAnimationFrame(st.rafId);
        st.rafId = null;
    };

    const updateShine = (el: HTMLElement, rect: DOMRect, cx: number, cy: number, dx: number, dy: number) => {
        if (!shineSelector) return;
        const shine = el.querySelector<HTMLElement>(shineSelector);
        if (!shine) return;
        const x = cx - rect.left;
        const y = cy - rect.top;
        const opacity = (shineBaseOpacity + Math.abs(dx) * shineBoost + Math.abs(dy) * shineBoost).toFixed(3);
        shine.style.background = `radial-gradient(circle ${shineSize}px at ${x}px ${y}px, rgba(255,255,255,${opacity}) 0%, transparent ${shineTransparentAt}%)`;
    };

    const onMouseMove = (event: MouseEvent<HTMLElement>) => {
        const el = resolveElement(event);
        if (!el) return;

        clearLeaveTimer(el);
        el.style.transitionProperty = "transform";
        el.style.transitionDuration = "0ms";
        el.style.transitionTimingFunction = "linear";

        const st = rafState.current.get(el) ?? { rafId: null, clientX: 0, clientY: 0, hit: null };
        st.clientX = event.clientX;
        st.clientY = event.clientY;
        st.hit = event.currentTarget;

        if (!st.rafId) {
            st.rafId = requestAnimationFrame(() => {
                const rect = (st.hit ?? el).getBoundingClientRect();
                const dx = (st.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
                const dy = (st.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

                el.style.transform = `perspective(${perspective}px) rotateX(${(-dy * rotate).toFixed(2)}deg) rotateY(${(dx * rotate).toFixed(2)}deg) scale(${scale})`;
                updateShine(el, el.getBoundingClientRect(), st.clientX, st.clientY, dx, dy);
                st.rafId = null;
            });
        }
        rafState.current.set(el, st);
    };

    const onMouseLeave = (event: MouseEvent<HTMLElement>) => {
        const el = resolveElement(event);
        if (!el) return;

        cancelPendingFrame(el);
        clearLeaveTimer(el);

        el.style.transitionProperty = "transform";
        el.style.transitionDuration = `${resetDuration}ms`;
        el.style.transitionTimingFunction = resetTiming;
        el.style.transform = "";

        if (shineSelector) {
            const shine = el.querySelector<HTMLElement>(shineSelector);
            if (shine) shine.style.background = "";
        }

        const timer = window.setTimeout(() => {
            el.style.transitionProperty = "";
            el.style.transitionDuration = "";
            el.style.transitionTimingFunction = "";
            leaveTimers.current.delete(el);
        }, resetDuration + 20);
        leaveTimers.current.set(el, timer);
    };

    useEffect(() => {
        const frames = rafState.current;
        const timers = leaveTimers.current;
        return () => {
            frames.forEach((st) => {
                if (st.rafId) cancelAnimationFrame(st.rafId);
            });
            frames.clear();
            timers.forEach((t) => window.clearTimeout(t));
            timers.clear();
        };
    }, []);

    return { onMouseMove, onMouseLeave };
}