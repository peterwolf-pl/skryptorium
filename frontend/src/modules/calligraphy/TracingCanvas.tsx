import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { LetterTemplate, Point } from './LetterTemplates';

export type StrokeClassification = 'hit' | 'miss';

interface StrokeEvaluation {
  scaledPoints: Point[];
  statuses: StrokeClassification[];
}

interface EvaluationResult {
  accuracy: number;
  coverage: number;
  strokeEvaluations: StrokeEvaluation[];
  referenceStrokes: Point[][];
}

export interface EvaluationDetails {
  accuracy: number;
  coverage: number;
  strokeCount: number;
}

export interface TracingCanvasProps {
  template: LetterTemplate;
  onEvaluationChange?: (evaluation: EvaluationDetails) => void;
}

export interface TracingCanvasHandle {
  reset: () => void;
  undo: () => void;
}

const PARCHMENT_COLORS = ['#f8f1e5', '#f1e4c6'];

function scalePoint(point: Point, dimensions: { width: number; height: number }): Point {
  return {
    x: point.x * dimensions.width,
    y: point.y * dimensions.height,
  };
}

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function catmullRomSpline(points: Point[], segments = 12): Point[] {
  if (points.length < 2) {
    return points.map(clonePoint);
  }
  const result: Point[] = [];
  const pts = [points[0], ...points, points[points.length - 1]];
  for (let i = 0; i < pts.length - 3; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        ((2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 *
        ((2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      result.push({ x, y });
    }
  }
  return result;
}

function smoothStroke(points: Point[]): Point[] {
  if (points.length <= 3) {
    return points.map(clonePoint);
  }
  return catmullRomSpline(points, 8);
}

function distance(pointA: Point, pointB: Point): number {
  const dx = pointA.x - pointB.x;
  const dy = pointA.y - pointB.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function evaluateStrokes(
  strokes: Point[][],
  referenceStrokes: Point[][],
  dimensions: { width: number; height: number }
): EvaluationResult {
  const scaledReferenceStrokes = referenceStrokes.map((stroke) => stroke.map((point) => scalePoint(point, dimensions)));
  const referencePoints = scaledReferenceStrokes.flat();
  const coverageFlags = new Array(referencePoints.length).fill(false);
  const threshold = Math.min(dimensions.width, dimensions.height) * 0.07;
  let matchedPoints = 0;
  let totalPoints = 0;

  const strokeEvaluations: StrokeEvaluation[] = strokes.map((stroke) => {
    const scaledPoints = stroke.map((point) => scalePoint(point, dimensions));
    const statuses: StrokeClassification[] = scaledPoints.map((point) => {
      totalPoints += 1;
      if (referencePoints.length === 0) {
        matchedPoints += 1;
        return 'hit';
      }
      let shortestDistance = Infinity;
      let closestIndex = -1;
      for (let i = 0; i < referencePoints.length; i++) {
        const referencePoint = referencePoints[i];
        const d = distance(point, referencePoint);
        if (d < shortestDistance) {
          shortestDistance = d;
          closestIndex = i;
        }
      }
      if (shortestDistance <= threshold && closestIndex >= 0) {
        matchedPoints += 1;
        coverageFlags[closestIndex] = true;
        return 'hit';
      }
      return 'miss';
    });
    return { scaledPoints, statuses };
  });

  const accuracy = totalPoints === 0 ? 1 : matchedPoints / totalPoints;
  const covered = coverageFlags.filter(Boolean).length;
  const coverage = referencePoints.length === 0 ? 1 : covered / referencePoints.length;

  return {
    accuracy,
    coverage,
    strokeEvaluations,
    referenceStrokes: scaledReferenceStrokes,
  };
}

function createParchmentGradient(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, PARCHMENT_COLORS[0]);
  gradient.addColorStop(1, PARCHMENT_COLORS[1]);
  return gradient;
}

function renderReferenceStrokes(
  ctx: CanvasRenderingContext2D,
  referenceStrokes: Point[][],
  strokeWidth: number
) {
  ctx.save();
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = 'rgba(80, 45, 10, 0.35)';
  ctx.setLineDash([10, 12]);
  ctx.lineCap = 'round';
  referenceStrokes.forEach((stroke) => {
    if (stroke.length < 2) {
      return;
    }
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  });
  ctx.restore();
}

function renderUserStrokes(
  ctx: CanvasRenderingContext2D,
  evaluations: StrokeEvaluation[],
  strokeWidth: number
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  evaluations.forEach((evaluation) => {
    if (evaluation.scaledPoints.length < 2) {
      return;
    }
    const smoothed = smoothStroke(evaluation.scaledPoints);
    for (let i = 0; i < smoothed.length - 1; i++) {
      const status = evaluation.statuses[Math.min(i, evaluation.statuses.length - 1)];
      ctx.strokeStyle = status === 'hit' ? '#1b7f5c' : '#c0392b';
      ctx.beginPath();
      ctx.moveTo(smoothed[i].x, smoothed[i].y);
      ctx.lineTo(smoothed[i + 1].x, smoothed[i + 1].y);
      ctx.stroke();
    }
  });
  ctx.restore();
}

const TracingCanvas = forwardRef<TracingCanvasHandle, TracingCanvasProps>(function TracingCanvas(
  { template, onEvaluationChange },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [pixelRatio, setPixelRatio] = useState(() => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        setStrokes([]);
        setCurrentStroke([]);
      },
      undo() {
        setStrokes((previous) => previous.slice(0, Math.max(previous.length - 1, 0)));
      },
    }),
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () => {
      setPixelRatio(window.devicePixelRatio || 1);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = template.canvas.width * pixelRatio;
    canvas.height = template.canvas.height * pixelRatio;
    canvas.style.width = `${template.canvas.width}px`;
    canvas.style.height = `${template.canvas.height}px`;
  }, [template, pixelRatio]);

  useEffect(() => {
    const nextImage = new Image();
    nextImage.src = template.image;
    nextImage.onload = () => setImage(nextImage);
    nextImage.onerror = () => setImage(null);
    return () => {
      nextImage.onload = null;
      nextImage.onerror = null;
    };
  }, [template]);

  useEffect(() => {
    setStrokes([]);
    setCurrentStroke([]);
  }, [template.id]);

  const allStrokes = useMemo(() => {
    if (currentStroke.length === 0) {
      return strokes;
    }
    return [...strokes, currentStroke];
  }, [currentStroke, strokes]);

  const evaluation = useMemo(() => {
    return evaluateStrokes(allStrokes, template.referenceStrokes, template.canvas);
  }, [allStrokes, template]);

  useEffect(() => {
    if (!onEvaluationChange) {
      return;
    }
    onEvaluationChange({
      accuracy: evaluation.accuracy,
      coverage: evaluation.coverage,
      strokeCount: strokes.length,
    });
  }, [evaluation, strokes.length, onEvaluationChange]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const { width, height } = template.canvas;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    ctx.fillStyle = createParchmentGradient(ctx, width, height);
    ctx.fillRect(0, 0, width, height);

    if (image) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.drawImage(image, 0, 0, width, height);
      ctx.restore();
    }

    renderReferenceStrokes(ctx, evaluation.referenceStrokes, Math.max(width, height) * 0.01 + 2);
    renderUserStrokes(ctx, evaluation.strokeEvaluations, Math.max(width, height) * 0.03 + 2);
  }, [evaluation, image, pixelRatio, template.canvas]);

  useEffect(() => {
    render();
  }, [render]);

  const updateCurrentStroke = useCallback((point: Point) => {
    setCurrentStroke((previous) => [...previous, point]);
  }, []);

  const commitCurrentStroke = useCallback(() => {
    setStrokes((previous) => {
      if (currentStroke.length === 0) {
        return previous;
      }
      return [...previous, currentStroke];
    });
    setCurrentStroke([]);
  }, [currentStroke]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      canvas.setPointerCapture(event.pointerId);
      const rect = canvas.getBoundingClientRect();
      const point = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
      setCurrentStroke([point]);
    },
    []
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (event.buttons === 0) {
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const point = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
      if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
        return;
      }
      updateCurrentStroke(point);
    },
    [updateCurrentStroke]
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      canvas.releasePointerCapture(event.pointerId);
      if (currentStroke.length > 0) {
        commitCurrentStroke();
      }
    },
    [commitCurrentStroke, currentStroke.length]
  );

  return (
    <div className="tracing-canvas">
      <canvas
        ref={canvasRef}
        className="tracing-canvas__surface"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
});

export default TracingCanvas;
