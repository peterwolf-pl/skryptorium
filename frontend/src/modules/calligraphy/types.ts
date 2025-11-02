export type Point = {
  x: number;
  y: number;
  pressure?: number;
};

export type StrokeDefinition = {
  id: string;
  path: Point[];
  weight?: number;
};

export type LetterTemplate = {
  id: string;
  name: string;
  alphabetId: string;
  alphabetName: string;
  width: number;
  height: number;
  backgroundTexture?: string;
  preview: string;
  strokes: StrokeDefinition[];
};

export type TemplateManifest = {
  alphabets: {
    id: string;
    name: string;
    letters: {
      id: string;
      name: string;
      template: string;
      preview: string;
    }[];
  }[];
};

export type StrokeEvaluation = {
  coverage: number;
  averageDeviation: number;
  segments: {
    start: Point;
    end: Point;
    color: string;
  }[];
};

export type EvaluationSummary = {
  score: number;
  coverage: number;
  averageDeviation: number;
  message: string;
};
