import { EvaluationSummary, LetterTemplate, Point, StrokeDefinition, StrokeEvaluation, TemplateManifest } from './types';

const cache = new Map<string, LetterTemplate>();
let manifestPromise: Promise<TemplateManifest> | null = null;

export const loadManifest = async (): Promise<TemplateManifest> => {
  if (!manifestPromise) {
    manifestPromise = fetch('/templates/manifest.json').then(async (response) => {
      if (!response.ok) {
        throw new Error(`Unable to load template manifest: ${response.status}`);
      }
      return (await response.json()) as TemplateManifest;
    });
  }
  return manifestPromise;
};

export const loadTemplate = async (templateUrl: string): Promise<LetterTemplate> => {
  if (cache.has(templateUrl)) {
    return cache.get(templateUrl)!;
  }

  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Unable to load template at ${templateUrl}: ${response.status}`);
  }
  const data = (await response.json()) as LetterTemplate;
  cache.set(templateUrl, data);
  return data;
};

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const resamplePath = (points: Point[], sampleCount = 120): Point[] => {
  if (points.length === 0) {
    return [];
  }
  const lengthSegments: number[] = [0];
  let totalLength = 0;
  for (let i = 1; i < points.length; i += 1) {
    totalLength += distance(points[i - 1], points[i]);
    lengthSegments.push(totalLength);
  }

  if (totalLength === 0) {
    return [...points];
  }

  const result: Point[] = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const target = (totalLength * i) / (sampleCount - 1);
    let idx = lengthSegments.findIndex((value) => value >= target);
    if (idx === -1) {
      idx = lengthSegments.length - 1;
    }
    const prevIdx = Math.max(idx - 1, 0);
    const prevLength = lengthSegments[prevIdx];
    const nextLength = lengthSegments[idx];
    const segmentLength = nextLength - prevLength || 1;
    const t = (target - prevLength) / segmentLength;
    const prevPoint = points[prevIdx];
    const nextPoint = points[idx];
    result.push({
      x: prevPoint.x + (nextPoint.x - prevPoint.x) * t,
      y: prevPoint.y + (nextPoint.y - prevPoint.y) * t,
    });
  }
  return result;
};

const catmullRomSpline = (points: Point[], tension = 0.5, segments = 16): Point[] => {
  if (points.length < 2) {
    return points;
  }
  const pts = [points[0], ...points, points[points.length - 1]];
  const result: Point[] = [];

  for (let i = 0; i < pts.length - 3; i += 1) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];

    for (let j = 0; j < segments; j += 1) {
      const t = j / segments;
      const tt = t * t;
      const ttt = tt * t;

      const q0 = -tension * ttt + 2 * tension * tt - tension * t;
      const q1 = (2 - tension) * ttt + (tension - 3) * tt + 1;
      const q2 = (tension - 2) * ttt + (3 - 2 * tension) * tt + tension * t;
      const q3 = tension * ttt - tension * tt;

      result.push({
        x: q0 * p0.x + q1 * p1.x + q2 * p2.x + q3 * p3.x,
        y: q0 * p0.y + q1 * p1.y + q2 * p2.y + q3 * p3.y,
      });
    }
  }
  result.push(points[points.length - 1]);
  return result;
};

export const smoothStroke = (stroke: Point[]): Point[] => catmullRomSpline(stroke);

export const evaluateStroke = (
  stroke: Point[],
  reference: Point[],
  threshold: number
): StrokeEvaluation => {
  if (stroke.length < 2 || reference.length === 0) {
    return {
      coverage: 0,
      averageDeviation: Number.POSITIVE_INFINITY,
      segments: [],
    };
  }

  const sampledStroke = resamplePath(stroke, 90);
  const sampledReference = resamplePath(reference, 160);

  let coverageHits = 0;
  let deviationSum = 0;
  const segments: StrokeEvaluation['segments'] = [];

  const refDistances = sampledReference.map((refPoint) => {
    let minDist = Number.POSITIVE_INFINITY;
    for (const strokePoint of sampledStroke) {
      const dist = distance(refPoint, strokePoint);
      if (dist < minDist) {
        minDist = dist;
      }
    }
    return minDist;
  });

  for (let i = 0; i < sampledStroke.length - 1; i += 1) {
    const current = sampledStroke[i];
    const next = sampledStroke[i + 1];
    let minDist = Number.POSITIVE_INFINITY;
    for (const refPoint of sampledReference) {
      const dist = distance(current, refPoint);
      if (dist < minDist) {
        minDist = dist;
      }
    }
    deviationSum += minDist;
    if (minDist <= threshold) {
      coverageHits += 1;
    }
    segments.push({
      start: current,
      end: next,
      color: minDist <= threshold ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.85)',
    });
  }

  const coverage = refDistances.filter((value) => value <= threshold).length / refDistances.length;
  const averageDeviation = deviationSum / sampledStroke.length;

  return {
    coverage,
    averageDeviation,
    segments,
  };
};

export const evaluateDrawing = (
  strokes: Point[][],
  template: StrokeDefinition[],
  threshold: number
): EvaluationSummary => {
  if (!strokes.length || !template.length) {
    return {
      score: 0,
      coverage: 0,
      averageDeviation: Number.POSITIVE_INFINITY,
      message: 'Zacznij rysować, aby otrzymać ocenę.',
    };
  }

  const minStrokeCount = Math.min(strokes.length, template.length);
  let totalCoverage = 0;
  let totalDeviation = 0;

  for (let i = 0; i < minStrokeCount; i += 1) {
    const evaluation = evaluateStroke(strokes[i], template[i].path, threshold);
    totalCoverage += evaluation.coverage;
    totalDeviation += evaluation.averageDeviation;
  }

  const coverage = totalCoverage / minStrokeCount;
  const averageDeviation = totalDeviation / minStrokeCount;
  const normalizedDeviation = Math.max(averageDeviation / threshold, 0.01);
  const score = Math.max(0, Math.min(100, Math.round(coverage * 100 - normalizedDeviation * 35)));

  let message = 'Świetnie! Twój szkic bardzo dobrze pokrywa wzór.';
  if (score < 30) {
    message = 'Spróbuj jeszcze raz — skup się na prowadzeniu linii po wzorze.';
  } else if (score < 60) {
    message = 'Całkiem nieźle! Zwróć uwagę na miejsca zaznaczone na czerwono.';
  } else if (score < 85) {
    message = 'Bardzo dobrze! Kilka fragmentów wymaga dopracowania.';
  }

  return {
    score,
    coverage,
    averageDeviation,
    message,
  };
};

export const scaleTemplateStroke = (
  stroke: StrokeDefinition,
  scaleX: number,
  scaleY: number
): StrokeDefinition => ({
  ...stroke,
  path: stroke.path.map((point) => ({
    x: point.x * scaleX,
    y: point.y * scaleY,
  })),
});

export const scaleTemplate = (
  template: LetterTemplate,
  width: number,
  height: number
): LetterTemplate => {
  const scaleX = width / template.width;
  const scaleY = height / template.height;
  return {
    ...template,
    width,
    height,
    strokes: template.strokes.map((stroke) => scaleTemplateStroke(stroke, scaleX, scaleY)),
  };
};

