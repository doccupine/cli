export const mermaidViewTemplate = `"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { interactiveStyles, resetButton } from "cherry-styled-components";
import { Theme } from "@/app/theme";
import { Icon } from "@/components/layout/Icon";

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;
const PAN_STEP = 48;
const AUTO_ACTIONS_MIN_HEIGHT = 120;

export type MermaidPlacement =
  "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface MermaidViewProps {
  svg: string;
  width?: number | null;
  placement?: MermaidPlacement;
  actions?: boolean;
  theme?: Theme;
}

const Viewport = styled.div<{ $draggable: boolean; $dragging: boolean }>\`
  overflow: hidden;
  padding: 16px;
  \${({ $draggable, $dragging }) =>
    $draggable &&
    css\`
      cursor: \${$dragging ? "grabbing" : "grab"};
      user-select: none;
    \`}
\`;

const Stage = styled.div<{
  $scale: number;
  $x: number;
  $y: number;
  $dragging: boolean;
}>\`
  transform: translate(\${({ $x }) => $x}px, \${({ $y }) => $y}px)
    scale(\${({ $scale }) => $scale});
  transform-origin: center center;
  transition: \${({ $dragging }) =>
    $dragging ? "none" : "transform 0.15s ease-out"};
  margin: 0 auto;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  & > svg {
    display: block;
    width: 100%;
    height: auto;
    margin: 0 auto;
  }
\`;

const Figure = styled.figure<{ theme: Theme }>\`
  position: relative;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  background: \${({ theme }) => theme.colors.light};
  overflow: hidden;

  &:fullscreen {
    border: none;
    border-radius: 0;

    \${Viewport} {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    \${Stage} {
      width: 100%;
      height: 100%;
    }

    \${Stage} > svg {
      height: 100%;
    }
  }
\`;

const Controls = styled.div<{ theme: Theme; $placement: MermaidPlacement }>\`
  position: absolute;
  \${({ $placement }) => {
    const [vertical, horizontal] = $placement.split("-");
    return css\`
      \${vertical}: 8px;
      \${horizontal}: 8px;
    \`;
  }}
  display: grid;
  grid-template-columns: repeat(3, 24px);
  grid-template-rows: repeat(3, 24px);
  gap: 2px;
  padding: 4px;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  background: \${({ theme }) => theme.colors.light};
  box-shadow: \${({ theme }) => theme.shadows.sm};
\`;

const ControlButton = styled.button<{ theme: Theme }>\`
  \${resetButton};
  \${interactiveStyles};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: \${({ theme }) => theme.colors.grayDark};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: \${({ theme }) => theme.colors.grayLight};
    color: \${({ theme }) => theme.colors.dark};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
\`;

function MermaidView({
  svg,
  width,
  placement = "bottom-right",
  actions,
  ...props
}: MermaidViewProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [autoShow, setAutoShow] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
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
    setCanFullscreen(Boolean(document.fullscreenEnabled));
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
    <Figure ref={figureRef} {...props}>
      <Viewport
        ref={viewportRef}
        $draggable={showControls}
        $dragging={dragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <Stage
          $scale={scale}
          $x={offset.x}
          $y={offset.y}
          $dragging={dragging}
          style={
            width && !isFullscreen ? { maxWidth: \`\${width}px\` } : undefined
          }
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </Viewport>

      {showControls && (
        <Controls $placement={placement}>
          <ControlButton
            type="button"
            aria-label="Zoom out"
            onClick={() => zoom(-SCALE_STEP)}
            disabled={scale <= MIN_SCALE}
          >
            <Icon name="zoom-out" size={14} />
          </ControlButton>
          <ControlButton
            type="button"
            aria-label="Pan up"
            onClick={() => pan(0, -PAN_STEP)}
          >
            <Icon name="chevron-up" size={14} />
          </ControlButton>
          <ControlButton
            type="button"
            aria-label="Zoom in"
            onClick={() => zoom(SCALE_STEP)}
            disabled={scale >= MAX_SCALE}
          >
            <Icon name="zoom-in" size={14} />
          </ControlButton>

          <ControlButton
            type="button"
            aria-label="Pan left"
            onClick={() => pan(-PAN_STEP, 0)}
          >
            <Icon name="chevron-left" size={14} />
          </ControlButton>
          <ControlButton
            type="button"
            aria-label="Reset view"
            onClick={reset}
            disabled={isReset}
          >
            <Icon name="rotate-ccw" size={14} />
          </ControlButton>
          <ControlButton
            type="button"
            aria-label="Pan right"
            onClick={() => pan(PAN_STEP, 0)}
          >
            <Icon name="chevron-right" size={14} />
          </ControlButton>

          {canFullscreen ? (
            <ControlButton
              type="button"
              aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
              onClick={toggleFullscreen}
            >
              <Icon name={isFullscreen ? "minimize" : "maximize"} size={14} />
            </ControlButton>
          ) : (
            <span />
          )}
          <ControlButton
            type="button"
            aria-label="Pan down"
            onClick={() => pan(0, PAN_STEP)}
          >
            <Icon name="chevron-down" size={14} />
          </ControlButton>
          <span />
        </Controls>
      )}
    </Figure>
  );
}

export { MermaidView };
`;
