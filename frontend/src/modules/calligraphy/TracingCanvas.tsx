import React, {
  ForwardedRef,
  MutableRefObject,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  EvaluationSummary,
  LetterTemplate,
  Point,
  StrokeEvaluation,
} from './types';
import { evaluateDrawing, evaluateStroke, scaleTemplate, smoothStroke } from './templateLoader';

type PointerState = {
  id: number;
  strokeIndex: number;
};

type TracingCanvasProps = {
  template: LetterTemplate | null;
  width?: number;
  height?: number;
  onEvaluationChange?: (evaluation: EvaluationSummary | null) => void;
  onStrokeUpdate?: (strokes: Point[][]) => void;
};

export type TracingCanvasHandle = {
  reset: () => void;
  undo: () => void;
};

const defaultSize = 540;

const createCanvasContext = (canvas: HTMLCanvasElement | null) =>
  canvas?.getContext('2d', { desynchronized: true });

const toCanvasPoint = (
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  boundingRect: DOMRect
): Point => {
  const x = ((event.clientX - boundingRect.left) * canvas.width) / boundingRect.width;
  const y = ((event.clientY - boundingRect.top) * canvas.height) / boundingRect.height;
  return {
    x,
    y,
    pressure: event.pressure,
  };
};

const drawTemplate = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  width: number,
  height: number
) => {
  if (!image) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.drawImage(image, 0, 0, width, height);
  ctx.restore();
};

const drawEvaluationSegments = (
  ctx: CanvasRenderingContext2D,
  evaluations: StrokeEvaluation[],
  lineWidth: number
) => {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const evaluation of evaluations) {
    for (const segment of evaluation.segments) {
      ctx.beginPath();
      ctx.strokeStyle = segment.color;
      ctx.lineWidth = lineWidth;
      ctx.moveTo(segment.start.x, segment.start.y);
      ctx.lineTo(segment.end.x, segment.end.y);
      ctx.stroke();
    }
  }
};

const drawActiveStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: Point[] | null,
  lineWidth: number
) => {
  if (!stroke || stroke.length < 2) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = 'rgba(59,130,246,0.9)';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(stroke[0].x, stroke[0].y);
  for (let i = 1; i < stroke.length; i += 1) {
    ctx.lineTo(stroke[i].x, stroke[i].y);
  }
  ctx.stroke();
  ctx.restore();
};

const useAnimationFrame = (
  callback: () => void,
  enabled: boolean
): MutableRefObject<number | null> => {
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (frame.current) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      return () => undefined;
    }

    const loop = () => {
      callback();
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);

    return () => {
      if (frame.current) {
        cancelAnimationFrame(frame.current);
      }
      frame.current = null;
    };
  }, [callback, enabled]);

  return frame;
};

const TracingCanvas = (
  { template, width = defaultSize, height = defaultSize, onEvaluationChange, onStrokeUpdate }: TracingCanvasProps,
  ref: ForwardedRef<TracingCanvasHandle>
) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parchmentRef = useRef<HTMLDivElement | null>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [activeStroke, setActiveStroke] = useState<Point[] | null>(null);
  const [strokeEvaluations, setStrokeEvaluations] = useState<StrokeEvaluation[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationSummary | null>(null);
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);
  const pointerState = useRef<PointerState | null>(null);

  const scaledTemplate = useMemo(() => {
    if (!template) {
      return null;
    }
    return scaleTemplate(template, width, height);
  }, [template, width, height]);

  useEffect(() => {
    if (!template) {
      setTemplateImage(null);
      return;
    }
    const image = new Image();
    image.src = template.preview;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      setTemplateImage(image);
    };
    image.onerror = () => {
      setTemplateImage(null);
    };
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [template]);

  useEffect(() => {
    setStrokes([]);
    setActiveStroke(null);
    setStrokeEvaluations([]);
    setEvaluation(null);
  }, [scaledTemplate]);

  const threshold = useMemo(() => Math.min(width, height) * 0.05, [width, height]);

  useEffect(() => {
    if (!scaledTemplate) {
      return;
    }
    if (!strokes.length) {
      setStrokeEvaluations([]);
      setEvaluation(null);
      if (onEvaluationChange) {
        onEvaluationChange(null);
      }
      if (onStrokeUpdate) {
        onStrokeUpdate([]);
      }
      return;
    }
    const smoothedStrokes = strokes.map((stroke) => smoothStroke(stroke));
    const evaluations = smoothedStrokes.map((stroke, index) => {
      const templateStroke = scaledTemplate.strokes[index];
      if (!templateStroke) {
        return {
          coverage: 0,
          averageDeviation: Number.POSITIVE_INFINITY,
          segments: [],
        };
      }
      return evaluateStroke(stroke, templateStroke.path, threshold);
    });

    setStrokeEvaluations(evaluations);

    const summary = evaluateDrawing(smoothedStrokes, scaledTemplate.strokes, threshold);
    setEvaluation(summary);
    if (onEvaluationChange) {
      onEvaluationChange(summary);
    }
    if (onStrokeUpdate) {
      onStrokeUpdate(smoothedStrokes);
    }
  }, [strokes, scaledTemplate, onEvaluationChange, onStrokeUpdate, threshold]);

  const reset = useCallback(() => {
    setStrokes([]);
    setActiveStroke(null);
    setStrokeEvaluations([]);
    setEvaluation(null);
    if (onEvaluationChange) {
      onEvaluationChange(null);
    }
    if (onStrokeUpdate) {
      onStrokeUpdate([]);
    }
  }, [onEvaluationChange, onStrokeUpdate]);

  const undo = useCallback(() => {
    setStrokes((previous) => {
      if (!previous.length) {
        return previous;
      }
      const updated = previous.slice(0, previous.length - 1);
      return updated;
    });
    setActiveStroke(null);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      reset,
      undo,
    }),
    [reset, undo]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = createCanvasContext(canvas);
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(245, 233, 211, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTemplate(ctx, templateImage, canvas.width, canvas.height);

    const lineWidth = Math.max(2, Math.min(canvas.width, canvas.height) * 0.02);
    drawEvaluationSegments(ctx, strokeEvaluations, lineWidth);
    drawActiveStroke(ctx, activeStroke, lineWidth);
  }, [activeStroke, strokeEvaluations, templateImage]);

  useAnimationFrame(draw, true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!canvas) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const point = toCanvasPoint(event, canvas, rect);
      pointerState.current = {
        id: event.pointerId,
        strokeIndex: strokes.length,
      };
      setActiveStroke([point]);
      setStrokes((previous) => {
        const updated = [...previous, [point]];
        return updated;
      });
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!canvas || !pointerState.current) {
        return;
      }
      if (pointerState.current.id !== event.pointerId) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const point = toCanvasPoint(event, canvas, rect);
      setActiveStroke((current) => {
        if (!current) {
          return [point];
        }
        if (current.length > 1) {
          const prev = current[current.length - 1];
          if (distance(prev, point) < 0.5) {
            return current;
          }
        }
        return [...current, point];
      });
      setStrokes((previous) => {
        const updated = [...previous];
        if (!pointerState.current) {
          return updated;
        }
        const index = pointerState.current.strokeIndex;
        const currentStroke = updated[index] ?? [];
        updated[index] = [...currentStroke, point];
        return updated;
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!canvas || !pointerState.current) {
        return;
      }
      if (pointerState.current.id !== event.pointerId) {
        return;
      }
      canvas.releasePointerCapture(event.pointerId);
      pointerState.current = null;
      setActiveStroke(null);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [strokes.length]);

  return (
    <div
      ref={parchmentRef}
      className="calligraphy-tracing"
      style={{
        width,
        height,
        backgroundImage: `url(${scaledTemplate?.backgroundTexture ?? '/templates/textures/parchment.svg'})`,
        backgroundSize: 'cover',
        borderRadius: '18px',
        boxShadow: '0 14px 45px rgba(63, 50, 31, 0.25)',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '18px',
          cursor: 'crosshair',
        }}
      />
      {evaluation && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            padding: '8px 14px',
            borderRadius: 12,
            background: 'rgba(44, 30, 20, 0.68)',
            color: '#fdf5e6',
            fontFamily: '"Playfair Display", serif',
            fontSize: 14,
            maxWidth: '70%',
            backdropFilter: 'blur(4px)',
          }}
        >
          <strong style={{ display: 'block', fontSize: 16, marginBottom: 4 }}>
            Ocena: {evaluation.score}%
          </strong>
          <div style={{ fontSize: 13 }}>{evaluation.message}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Pokrycie wzoru: {(evaluation.coverage * 100).toFixed(0)}% | Średnie odchylenie:{' '}
            {evaluation.averageDeviation.toFixed(1)} px
          </div>
        </div>
      )}
    </div>
  );
};

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export default forwardRef(TracingCanvas);
