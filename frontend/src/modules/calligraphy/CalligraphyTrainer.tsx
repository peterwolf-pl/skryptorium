import { useEffect, useMemo, useRef, useState } from 'react';
import { Alphabet, LetterTemplate } from './LetterTemplates';
import { LetterSelector } from './LetterSelector';
import { useTemplateLibrary } from './useLetterTemplates';
import TracingCanvas, { EvaluationDetails, TracingCanvasHandle } from './TracingCanvas';

export function CalligraphyTrainer() {
  const { alphabets: alphabetSummaries, loading, error, loadAlphabet } = useTemplateLibrary();
  const [loadedAlphabets, setLoadedAlphabets] = useState<Alphabet[]>([]);
  const [selectedAlphabetId, setSelectedAlphabetId] = useState<string | null>(null);
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationDetails | null>(null);
  const canvasRef = useRef<TracingCanvasHandle>(null);

  useEffect(() => {
    if (selectedAlphabetId && !loadedAlphabets.some((alphabet) => alphabet.id === selectedAlphabetId)) {
      loadAlphabet(selectedAlphabetId)
        .then((alphabet) => {
          setLoadedAlphabets((previous) => {
            const next = previous.filter((item) => item.id !== alphabet.id);
            next.push(alphabet);
            return [...next];
          });
          if (!selectedLetterId && alphabet.letters.length > 0) {
            setSelectedLetterId(alphabet.letters[0].id);
          }
        })
        .catch((loadError: Error) => {
          console.error(loadError);
        });
    }
  }, [selectedAlphabetId, loadedAlphabets, loadAlphabet, selectedLetterId]);

  const alphabets = useMemo<Alphabet[]>(() => {
    if (alphabetSummaries.length === 0) {
      return loadedAlphabets;
    }
    return alphabetSummaries.map((summary) => {
      const loaded = loadedAlphabets.find((alphabet) => alphabet.id === summary.id);
      if (loaded) {
        return loaded;
      }
      return { ...summary, letters: [] };
    });
  }, [alphabetSummaries, loadedAlphabets]);

  const selectedAlphabet: Alphabet | null = useMemo(
    () => alphabets.find((alphabet) => alphabet.id === selectedAlphabetId) ?? null,
    [alphabets, selectedAlphabetId]
  );

  const selectedLetter: LetterTemplate | null = useMemo(() => {
    if (!selectedAlphabet || !selectedLetterId) {
      return null;
    }
    return selectedAlphabet.letters.find((letter) => letter.id === selectedLetterId) ?? null;
  }, [selectedAlphabet, selectedLetterId]);

  useEffect(() => {
    if (!selectedAlphabetId && alphabetSummaries.length > 0) {
      setSelectedAlphabetId(alphabetSummaries[0].id);
    }
  }, [alphabetSummaries, selectedAlphabetId]);

  const reset = () => {
    canvasRef.current?.reset();
  };

  const undo = () => {
    canvasRef.current?.undo();
  };

  return (
    <div className="calligraphy-trainer">
      <header className="calligraphy-trainer__header">
        <h1>Calligraphy practice</h1>
        {loading && <p>Loading alphabets…</p>}
        {error && <p className="calligraphy-trainer__error">{error}</p>}
      </header>
      {alphabets.length > 0 && (
        <LetterSelector
          alphabets={alphabets}
          selectedAlphabetId={selectedAlphabetId}
          onAlphabetChange={(id) => {
            setSelectedAlphabetId(id);
            setSelectedLetterId(null);
          }}
          selectedLetterId={selectedLetterId}
          onLetterChange={(id) => setSelectedLetterId(id)}
        />
      )}
      <div className="calligraphy-trainer__actions">
        <button type="button" onClick={undo}>
          Undo stroke
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      {selectedLetter ? (
        <TracingCanvas
          ref={canvasRef}
          template={selectedLetter}
          onEvaluationChange={setEvaluation}
        />
      ) : (
        <p className="calligraphy-trainer__placeholder">Select a letter to begin tracing.</p>
      )}
      {evaluation && (
        <section className="calligraphy-trainer__feedback">
          <h2>Feedback</h2>
          <ul>
            <li>
              Accuracy: <strong>{Math.round(evaluation.accuracy * 100)}%</strong>
            </li>
            <li>
              Coverage: <strong>{Math.round(evaluation.coverage * 100)}%</strong>
            </li>
            <li>
              Stroke count: <strong>{evaluation.strokeCount}</strong>
            </li>
          </ul>
          <p className="calligraphy-trainer__feedback-note">Aim for high accuracy and coverage by following the reference strokes closely.</p>
        </section>
      )}
    </div>
  );
}
