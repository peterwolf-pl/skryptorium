import { useMemo, useState } from 'react';
import { usePointerEvents, PointerHandlers } from './hooks/usePointerEvents';

type InteractionSnapshot = {
  tool: string;
  coordinates: { x: number; y: number } | null;
  status: string;
};

type SupportedEvent = Parameters<Required<PointerHandlers>['onStart']>[0];

const DEFAULT_SNAPSHOT: InteractionSnapshot = {
  tool: 'idle',
  coordinates: null,
  status: 'Przeciągnij rysikiem, aby rozpocząć szkic.'
};

function getToolName(event: SupportedEvent): string {
  if ('pointerType' in event) {
    switch (event.pointerType) {
      case 'pen':
        return 'rysik';
      case 'touch':
        return 'dotyk';
      case 'mouse':
        return 'mysz';
      default:
        return event.pointerType;
    }
  }

  if ('touches' in event || 'changedTouches' in event) {
    return 'dotyk';
  }

  return 'mysz';
}

function getCoordinates(event: SupportedEvent): { x: number; y: number } | null {
  if ('clientX' in event && 'clientY' in event) {
    return { x: event.clientX, y: event.clientY };
  }

  if ('touches' in event) {
    const touch = event.touches[0] ?? event.changedTouches?.[0];
    if (touch) {
      return { x: touch.clientX, y: touch.clientY };
    }
  }

  if ('changedTouches' in event) {
    const touch = event.changedTouches[0];
    if (touch) {
      return { x: touch.clientX, y: touch.clientY };
    }
  }

  return null;
}

function formatCoordinates(coordinates: { x: number; y: number } | null): string {
  if (!coordinates) {
    return 'n/a';
  }

  const { x, y } = coordinates;
  return `${Math.round(x)} × ${Math.round(y)}px`;
}

const features = [
  {
    title: 'Naturalne kreski',
    description:
      'Silnik dopracowany pod Apple Pencil i Surface Pen, z dbałością o mikro opóźnienia.',
  },
  {
    title: 'Warstwy pergaminu',
    description:
      'Tonacje i faktury inspirowane średniowiecznymi manuskryptami, gotowe do eksportu.',
  },
  {
    title: 'Współpraca na żywo',
    description:
      'Pracujcie na tym samym arkuszu w czasie rzeczywistym, niezależnie od urządzenia.',
  },
];

function App(): JSX.Element {
  const [snapshot, setSnapshot] = useState<InteractionSnapshot>(DEFAULT_SNAPSHOT);

  const handlers = useMemo<PointerHandlers>(
    () => ({
      onStart: (event) => {
        event.preventDefault?.();
        const coordinates = getCoordinates(event);
        setSnapshot({
          tool: getToolName(event),
          coordinates,
          status: 'Rysowanie rozpoczęte — utrzymaj płynny ruch.'
        });
      },
      onMove: (event) => {
        event.preventDefault?.();
        const coordinates = getCoordinates(event);
        setSnapshot((current) => ({
          ...current,
          coordinates,
          status: 'Rysowanie w toku...'
        }));
      },
      onEnd: (event) => {
        event.preventDefault?.();
        const coordinates = getCoordinates(event);
        setSnapshot({
          tool: getToolName(event),
          coordinates,
          status: 'Szkic zatrzymany — gotowy na kolejne pociągnięcie.'
        });
      }
    }),
    []
  );

  const { ref, isActive } = usePointerEvents<HTMLDivElement>(handlers);

  return (
    <main className="app-shell">
      <section className="hero">
        <header className="header">
          <span className="header__badge">Pergaminowy warsztat</span>
          <h1 className="header__title">Skryptorium</h1>
          <p className="header__subtitle">
            Zanurz się w cyfrowym doświadczeniu pergaminu. Projektuj ozdobne inicjały, mapy
            i marginalia z naturalnym feelingiem klasycznego skryptorium.
          </p>
        </header>

        <div ref={ref} className={`canvas-wrapper${isActive ? ' is-active' : ''}`}>
          <p className="canvas-hint">
            Aktywne narzędzie: <strong>{snapshot.tool}</strong>
          </p>
          <p className="canvas-hint">
            Pozycja wskaźnika: <strong>{formatCoordinates(snapshot.coordinates)}</strong>
          </p>
          <p className="canvas-hint">Stan: {snapshot.status}</p>
        </div>
      </section>

      <section>
        <div className="features">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        &copy; {new Date().getFullYear()} Skryptorium. Tworzone z miłości do rękopisów.
      </footer>
    </main>
  );
}

export default App;
