import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renderuje tytuł strony', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Skryptorium/i
      })
    ).toBeInTheDocument();
  });

  it('pokazuje funkcje pergaminu', () => {
    render(<App />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });
});
