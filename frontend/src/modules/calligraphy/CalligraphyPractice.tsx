import React, { useEffect, useRef, useState } from 'react';
import TracingCanvas, { TracingCanvasHandle } from './TracingCanvas';
import { EvaluationSummary, LetterTemplate, TemplateManifest } from './types';
import { loadManifest, loadTemplate } from './templateLoader';

const panelStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '360px 1fr',
  gap: '32px',
  alignItems: 'start',
  width: '100%',
  maxWidth: 1180,
  margin: '0 auto',
  padding: '40px 32px',
  boxSizing: 'border-box',
  fontFamily: '"Nunito", system-ui',
};

const sidebarStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.85)',
  borderRadius: 24,
  padding: '24px',
  boxShadow: '0 18px 30px rgba(15, 23, 42, 0.12)',
  backdropFilter: 'blur(12px)',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid rgba(15, 23, 42, 0.12)',
  fontSize: 15,
  marginBottom: 16,
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginTop: 16,
};

const buttonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  borderRadius: 12,
  border: 'none',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  background: '#0f172a',
  color: '#f1f5f9',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
};

const secondaryButton: React.CSSProperties = {
  ...buttonStyle,
  background: '#e2e8f0',
  color: '#0f172a',
};

const letterListStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
  gap: 12,
};

const letterTileStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: '10px',
  border: '1px solid rgba(15, 23, 42, 0.1)',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 0.15s ease',
  background: 'rgba(255,255,255,0.92)',
};

const selectedTileStyle: React.CSSProperties = {
  ...letterTileStyle,
  border: '2px solid #2563eb',
  boxShadow: '0 12px 30px rgba(37, 99, 235, 0.25)',
};

const feedbackCardStyle: React.CSSProperties = {
  marginTop: 24,
  padding: '18px',
  borderRadius: 18,
  background: 'rgba(15, 23, 42, 0.88)',
  color: '#e2e8f0',
  boxShadow: '0 16px 38px rgba(15, 23, 42, 0.35)',
};

const statListStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginTop: 12,
  flexWrap: 'wrap',
};

const statChipStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.08)',
  fontSize: 14,
};

const CalligraphyPractice: React.FC = () => {
  const [manifest, setManifest] = useState<TemplateManifest | null>(null);
  const [selectedAlphabet, setSelectedAlphabet] = useState<string | null>(null);
  const [selectedTemplatePath, setSelectedTemplatePath] = useState<string | null>(null);
  const [template, setTemplate] = useState<LetterTemplate | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationSummary | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const tracingRef = useRef<TracingCanvasHandle | null>(null);

  useEffect(() => {
    loadManifest()
      .then((data) => {
        setManifest(data);
        if (data.alphabets.length > 0) {
          const firstAlphabet = data.alphabets[0];
          setSelectedAlphabet(firstAlphabet.id);
          if (firstAlphabet.letters.length > 0) {
            setSelectedTemplatePath(firstAlphabet.letters[0].template);
          }
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Nie udało się pobrać manifestu kaligrafii', error);
      });
  }, []);

  useEffect(() => {
    if (!selectedTemplatePath || !manifest) {
      setTemplate(null);
      return;
    }
    setIsLoadingTemplate(true);
    loadTemplate(selectedTemplatePath)
      .then((loadedTemplate) => {
        setTemplate(loadedTemplate);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Błąd wczytywania wzoru litery', error);
        setTemplate(null);
      })
      .finally(() => {
        setIsLoadingTemplate(false);
        tracingRef.current?.reset();
      });
  }, [selectedTemplatePath, manifest]);

  const handleAlphabetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAlphabet = event.target.value;
    setSelectedAlphabet(newAlphabet);
    const alphabet = manifest?.alphabets.find((item) => item.id === newAlphabet);
    if (alphabet && alphabet.letters.length > 0) {
      setSelectedTemplatePath(alphabet.letters[0].template);
    }
  };

  const handleLetterClick = (templatePath: string) => {
    setSelectedTemplatePath(templatePath);
  };

  return (
    <div style={panelStyle}>
      <aside style={sidebarStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 700 }}>
          Trening Kaligrafii
        </h2>
        <label style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.2 }} htmlFor="alphabet-select">
          Alfabet
        </label>
        <select
          id="alphabet-select"
          style={selectStyle}
          value={selectedAlphabet ?? ''}
          onChange={handleAlphabetChange}
        >
          {manifest?.alphabets.map((alphabet) => (
            <option key={alphabet.id} value={alphabet.id}>
              {alphabet.name}
            </option>
          ))}
        </select>

        <div style={{ fontWeight: 600, marginBottom: 12 }}>Litery</div>
        <div style={letterListStyle}>
          {manifest?.alphabets
            .find((alphabet) => alphabet.id === selectedAlphabet)
            ?.letters.map((letter) => {
              const isSelected = letter.template === selectedTemplatePath;
              return (
                <button
                  key={letter.id}
                  type="button"
                  onClick={() => handleLetterClick(letter.template)}
                  style={isSelected ? selectedTileStyle : letterTileStyle}
                >
                  <div style={{ fontSize: 26, marginBottom: 4 }}>{letter.name}</div>
                  <img
                    src={letter.preview}
                    alt={letter.name}
                    style={{ width: '100%', height: 40, objectFit: 'contain', pointerEvents: 'none' }}
                  />
                </button>
              );
            })}
        </div>

        <div style={buttonRowStyle}>
          <button
            type="button"
            onClick={() => tracingRef.current?.undo()}
            style={secondaryButton}
            disabled={isLoadingTemplate}
          >
            Cofnij
          </button>
          <button
            type="button"
            onClick={() => tracingRef.current?.reset()}
            style={buttonStyle}
            disabled={isLoadingTemplate}
          >
            Wyczyść
          </button>
        </div>

        {evaluation && (
          <div style={feedbackCardStyle}>
            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.8 }}>
              Ocena ćwiczenia
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, marginTop: 6 }}>{evaluation.score}%</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>{evaluation.message}</div>
            <div style={statListStyle}>
              <span style={statChipStyle}>
                Pokrycie wzoru: {(evaluation.coverage * 100).toFixed(0)}%
              </span>
              <span style={statChipStyle}>
                Średnie odchylenie: {Number.isFinite(evaluation.averageDeviation)
                  ? `${evaluation.averageDeviation.toFixed(1)} px`
                  : '—'}
              </span>
            </div>
          </div>
        )}
      </aside>

      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <TracingCanvas
          ref={tracingRef}
          template={template}
          width={640}
          height={640}
          onEvaluationChange={setEvaluation}
        />
        {isLoadingTemplate && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: '#fff',
              background: 'rgba(15,23,42,0.45)',
              borderRadius: 18,
            }}
          >
            Ładowanie szablonu...
          </div>
        )}
      </div>
    </div>
  );
};

export default CalligraphyPractice;
