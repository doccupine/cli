export const mermaidViewTemplate = `"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Icon } from "@/components/layout/Icon";

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;
const PAN_STEP = 48;
// Must exceed the diagram's 320px min-height (.dcp-mermaid__stage > svg) plus
// the viewport padding (2 x 16px), so diagrams sitting on that floor don't
// auto-show the controls.
const AUTO_ACTIONS_MIN_HEIGHT = 420;

// Whether the Fullscreen API is available. Read via useSyncExternalStore so it
// resolves during render (SSR-safe: false on the server) instead of via a
// synchronous setState inside an effect. The capability never changes, so the
// subscribe callback is a stable no-op.
const subscribeFullscreenCapability = () => () => {};
const getFullscreenCapability = () =>
  typeof document !== "undefined" && Boolean(document.fullscreenEnabled);
const getFullscreenCapabilityServer = () => false;

export type MermaidPlacement =
  "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface MermaidViewProps {
  svg: string;
  width?: number | null;
  placement?: MermaidPlacement;
  actions?: boolean;
}

// Styles: .dcp-mermaid in app/styles/design.css. The pan and zoom are inline
// custom properties on the stage (--dcp-mermaid-x/-y/-scale).

function MermaidView({
  svg,
  width,
  placement = "bottom-right",
  actions,
}: MermaidViewProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [autoShow, setAutoShow] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canFullscreen = useSyncExternalStore(
    subscribeFullscreenCapability,
    getFullscreenCapability,
    getFullscreenCapabilityServer,
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const dragStart = useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
  } | null>(null);

  useEffect(() => {
    if (actions !== undefined) return;
    const element = viewportRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      setAutoShow(
        element.getBoundingClientRect().height > AUTO_ACTIONS_MIN_HEIGHT,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [actions]);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === figureRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const showControls = actions ?? autoShow;

  const zoom = useCallback((delta: number) => {
    setScale((current) =>
      Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, Math.round((current + delta) * 100) / 100),
      ),
    );
  }, []);

  const pan = useCallback((x: number, y: number) => {
    setOffset((current) => ({ x: current.x + x, y: current.y + y }));
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const element = figureRef.current;
    if (!element) return;
    if (document.fullscreenElement === element) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void element.requestFullscreen().catch(() => {});
    }
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!showControls || event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) return;
    setOffset({
      x: start.ox + (event.clientX - start.x),
      y: start.oy + (event.clientY - start.y),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    dragStart.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const isReset = scale === 1 && offset.x === 0 && offset.y === 0;

  return (
    <figure className="dcp-mermaid" ref={figureRef}>
      <div
        className="dcp-mermaid__viewport"
        ref={viewportRef}
        data-draggable={showControls || undefined}
        data-dragging={dragging || undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="dcp-mermaid__stage"
          data-dragging={dragging || undefined}
          style={
            {
              "--dcp-mermaid-x": \`\${offset.x}px\`,
              "--dcp-mermaid-y": \`\${offset.y}px\`,
              "--dcp-mermaid-scale": scale,
              ...(width && !isFullscreen ? { maxWidth: \`\${width}px\` } : {}),
            } as React.CSSProperties
          }
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {showControls && (
        <div className="dcp-mermaid__controls" data-placement={placement}>
          <button
            className="dcp-mermaid__control"
            type="button"
            aria-label="Zoom out"
            onClick={() => zoom(-SCALE_STEP)}
            disabled={scale <= MIN_SCALE}
          >
            <Icon name="zoom-out" size={14} />
          </button>
          <button
            className="dcp-mermaid__control"
            type="button"
            aria-label="Pan up"
            onClick={() => pan(0, -PAN_STEP)}
          >
            <Icon name="chevron-up" size={14} />
          </button>
          <button
            className="dcp-mermaid__control"
            type="button"
            aria-label="Zoom in"
            onClick={() => zoom(SCALE_STEP)}
            disabled={scale >= MAX_SCALE}
          >
            <Icon name="zoom-in" size={14} />
          </button>

          <button
            className="dcp-mermaid__control"
            type="button"
            aria-label="Pan left"
            onClick={() => pan(-PAN_STEP, 0)}
          >
            <Icon name="chevron-left" size={14} />
          </button>
          <button
            className="dcp-mermaid__control"
            type="button"
            aria-label="Reset view"
            onClick={reset}
            disabled={isReset}
          >
            <Icon name="rotate-ccw" size={14} />
          </button>
          <button
            className="dcp-mermaid__control"
            type="button"
            aria-label="Pan right"
            onClick={() => pan(PAN_STEP, 0)}
          >
            <Icon name="chevron-right" size={14} />
          </button>

          {canFullscreen ? (
            <button
              className="dcp-mermaid__control"
              type="button"
              aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
              onClick={toggleFullscreen}
            >
              <Icon name={isFullscreen ? "minimize" : "maximize"} size={14} />
            </button>
          ) : (
            <span />
          )}
          <button
            className="dcp-mermaid__control"
            type="button"
            aria-label="Pan down"
            onClick={() => pan(0, PAN_STEP)}
          >
            <Icon name="chevron-down" size={14} />
          </button>
          <span />
        </div>
      )}
    </figure>
  );
}

export { MermaidView };
`;
