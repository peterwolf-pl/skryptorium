import { useEffect, useMemo } from 'react';
import { Alphabet, LetterTemplate } from './LetterTemplates';

interface LetterSelectorProps {
  alphabets: Alphabet[];
  selectedAlphabetId: string | null;
  onAlphabetChange: (alphabetId: string) => void;
  selectedLetterId: string | null;
  onLetterChange: (letterId: string) => void;
}

export function LetterSelector({
  alphabets,
  selectedAlphabetId,
  onAlphabetChange,
  selectedLetterId,
  onLetterChange,
}: LetterSelectorProps) {
  const selectedAlphabet = useMemo(
    () => alphabets.find((alphabet) => alphabet.id === selectedAlphabetId) ?? null,
    [alphabets, selectedAlphabetId]
  );

  useEffect(() => {
    if (!selectedAlphabet && alphabets.length > 0) {
      onAlphabetChange(alphabets[0].id);
    }
  }, [alphabets, onAlphabetChange, selectedAlphabet]);

  useEffect(() => {
    if (selectedAlphabet && !selectedLetterId && selectedAlphabet.letters.length > 0) {
      onLetterChange(selectedAlphabet.letters[0].id);
    }
  }, [selectedAlphabet, selectedLetterId, onLetterChange]);

  const letters = selectedAlphabet?.letters ?? [];

  return (
    <div className="calligraphy-selector">
      <label className="calligraphy-selector__field">
        <span>Alphabet</span>
        <select
          value={selectedAlphabetId ?? ''}
          onChange={(event) => onAlphabetChange(event.target.value)}
        >
          {alphabets.map((alphabet) => (
            <option key={alphabet.id} value={alphabet.id}>
              {alphabet.name}
            </option>
          ))}
        </select>
      </label>
      <label className="calligraphy-selector__field">
        <span>Letter</span>
        <select value={selectedLetterId ?? ''} onChange={(event) => onLetterChange(event.target.value)}>
          {letters.map((letter: LetterTemplate) => (
            <option key={letter.id} value={letter.id}>
              {letter.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
