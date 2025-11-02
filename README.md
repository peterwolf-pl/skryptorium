# Skryptorium – instrukcja uruchomienia

Ten projekt zawiera interaktywny trener kaligrafii zbudowany w React/Vite. Poniższe kroki opisują sposób przygotowania środowiska i uruchomienia aplikacji w trybie deweloperskim lub produkcyjnym.

## Wymagania wstępne
- Node.js w wersji 18 LTS (lub nowszej) – polecane jest użycie [nvm](https://github.com/nvm-sh/nvm) do zarządzania wersjami.
- Menedżer pakietów `npm` (instalowany razem z Node.js).

## Instalacja zależności
1. Przejdź do katalogu projektu:
   ```bash
   cd skryptorium
   ```
2. Zainstaluj zależności części frontendowej:
   ```bash
   cd frontend
   npm install
   ```

> **Uwaga:** podczas instalacji zależności środowisko CI/CD może wymagać dostępu do rejestru npm. W przypadku błędów 403 upewnij się, że masz skonfigurowany dostęp do wszystkich prywatnych pakietów (w tym `@testing-library/jest-dom`).

## Uruchomienie w trybie deweloperskim
Po zainstalowaniu zależności uruchom serwer Vite:
```bash
npm run dev
```
Serwer wystartuje domyślnie pod adresem [http://localhost:5173](http://localhost:5173). Każda zmiana w plikach źródłowych będzie automatycznie odświeżała podgląd w przeglądarce.

## Budowanie wersji produkcyjnej
Aby zbudować zoptymalizowaną wersję aplikacji, wykonaj:
```bash
npm run build
```
Artefakty zostaną zapisane w katalogu `frontend/dist`. Możesz je zweryfikować lokalnie poleceniem:
```bash
npm run preview
```
które uruchomi serwer pod adresem [http://localhost:4173](http://localhost:4173).

## Testy i jakość kodu
Projekt zawiera gotowe skrypty ułatwiające utrzymanie jakości:
- Uruchomienie testów jednostkowych: `npm run test`
- Analiza lintem ESLint: `npm run lint`
- Sprawdzenie formatowania: `npm run format`
- Automatyczne formatowanie: `npm run format:write`

Wszystkie powyższe polecenia należy wykonywać w katalogu `frontend`.

## Struktura katalogów
```
frontend/
├── public/            # Statyczne zasoby (w tym szablony liter)
├── src/               # Kod źródłowy aplikacji React
├── package.json       # Skrypty npm i zależności
└── vite.config.ts     # Konfiguracja Vite
```

## Dalsze kroki
Po uruchomieniu aplikacji możesz rozpocząć ćwiczenia kaligraficzne, wybierając litery i alfabet w interfejsie trenera.
