import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alphabet, AlphabetSummary, LetterTemplate, loadAlphabet, loadTemplateIndex } from './LetterTemplates';

type TemplateState = {
  alphabets: AlphabetSummary[];
  loading: boolean;
  error: string | null;
};

export function useTemplateLibrary() {
  const [state, setState] = useState<TemplateState>({
    alphabets: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    loadTemplateIndex()
      .then((index) => {
        if (!cancelled) {
          setState({ alphabets: index.alphabets.map(({ id, name }) => ({ id, name })), loading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({ alphabets: [], loading: false, error: error.message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAlphabetById = useCallback(async (id: string): Promise<Alphabet> => {
    return loadAlphabet(id);
  }, []);

  return useMemo(
    () => ({
      alphabets: state.alphabets,
      loading: state.loading,
      error: state.error,
      loadAlphabet: loadAlphabetById,
    }),
    [state.alphabets, state.loading, state.error, loadAlphabetById]
  );
}

export function getLetterById(alphabet: Alphabet | null, letterId: string): LetterTemplate | null {
  if (!alphabet) {
    return null;
  }
  return alphabet.letters.find((letter) => letter.id === letterId) ?? null;
}
