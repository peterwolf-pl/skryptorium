export interface Point {
  x: number;
  y: number;
}

export interface LetterTemplate {
  id: string;
  label: string;
  image: string;
  referenceStrokes: Point[][];
  canvas: {
    width: number;
    height: number;
  };
}

export interface AlphabetSummary {
  id: string;
  name: string;
}

export interface Alphabet extends AlphabetSummary {
  letters: LetterTemplate[];
}

export interface TemplateIndex {
  alphabets: Array<AlphabetSummary & { source: string }>;
}

const INDEX_URL = '/templates/index.json';

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Unable to load template data from ${url} (${response.status})`);
  }
  return (await response.json()) as T;
}

export async function loadTemplateIndex(): Promise<TemplateIndex> {
  return fetchJSON<TemplateIndex>(INDEX_URL);
}

export async function loadAlphabet(id: string): Promise<Alphabet> {
  const data = await fetchJSON<Alphabet>(`/templates/${id}.json`);
  return data;
}

export type EvaluationSummary = {
  accuracy: number;
  coverage: number;
};
