# Skryptorium – instrukcja uruchomienia

Ten projekt zawiera interaktywny trener kaligrafii zbudowany w React/Vite. Poniższe kroki opisują sposób przygotowania środowiska i uruchomienia aplikacji w trybie deweloperskim lub produkcyjnym.

## Wymagania wstępne
- Node.js w wersji LTS (projekt testowany na `22.19.0`). W repozytorium znajduje się plik `.nvmrc`, dzięki któremu polecenie `nvm use` automatycznie przełączy środowisko na właściwą wersję.
- Menedżer pakietów `npm` (instalowany razem z Node.js). Jeżeli korzystasz z `corepack`, odpowiednia wersja (`npm@10.8.2`) zostanie pobrana na podstawie pola `packageManager` w `package.json`.

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

Jeżeli pracujesz z `nvm`, przed uruchomieniem powyższego polecenia wykonaj `nvm use`, aby aktywować wersję Node.js z pliku `.nvmrc`. W przypadku `corepack` możesz użyć `corepack install` (lub poleceń opisanych w sekcji *Rozwiązywanie problemów*), aby upewnić się, że wykorzystywana jest rekomendowana wersja `npm`.

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

## Rozwiązywanie problemów

- **Błąd `Error: ENOENT: no such file or directory, uv_cwd` podczas `npm install` (szczególnie w Node.js 24.x)** – globalna wersja npm dołączona do Node 24 potrafi zgłaszać ten błąd przy pracy w katalogach projektu. Aby temu zaradzić:
  1. Skorzystaj z `nvm` i przełącz się na wersję z pliku `.nvmrc`:
     ```bash
     nvm use
     cd frontend
     npm install
     ```
  2. Alternatywnie włącz `corepack` i przygotuj zalecaną wersję npm:
     ```bash
     corepack enable
     corepack prepare npm@10.8.2 --activate
     cd frontend
     npm install
     ```
  Oba podejścia zapewniają działanie `npm` w aktualnym katalogu roboczym i pozwalają uniknąć błędu `uv_cwd`.

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
