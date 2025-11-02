# Skryptorium Project Guidelines

## Scope
Te wskazówki obowiązują w całym repozytorium `skryptorium/`.

## Wizja projektu
- Celem aplikacji jest edukacyjna symulacja pracy skryby w średniowiecznym skryptorium.
- Interfejs powinien być zoptymalizowany pod ekrany dotykowe (zwłaszcza iPad + Apple Pencil), ale funkcjonalny również na desktopie.

## Stos technologiczny
- Preferowany stack front-endowy: **Next.js + TypeScript** uruchomiony przez `pnpm`.
- Komponenty i logika front-endu powinny mieszkać w katalogu `frontend/src/` z podziałem na moduły tematyczne (`calligraphy`, `story`, `ui`).
- Stylowanie realizuj przy pomocy CSS Modules lub Tailwind CSS. Zachowaj spójny motyw „pergaminu” (ciepła kolorystyka, tekstury papieru).

## Standardy kodu
- W kodzie TypeScript wymagaj typów we wszystkich publicznych funkcjach i komponentach.
- Nazwy komponentów React zapisuj w PascalCase, hooki w camelCase z prefiksem `use`.
- Teksty historyczne trzymaj w plikach konfiguracyjnych JSON w katalogu `content/`. Komponenty powinny pobierać je przez dedykowane hooki/serwisy, a nie importować surowo z wielu miejsc.

## Testy i jakość
- Wprowadzając funkcjonalność, dodawaj testy jednostkowe (`pnpm test`) i e2e (Playwright) tam, gdzie to możliwe.
- Uruchom `pnpm lint` oraz `pnpm test` przed wysłaniem zmian.

## Dokumentowanie zmian
- Opisy PR-ów powinny zawierać sekcje **Summary** oraz **Testing**, każda w formie wypunktowanej listy.
- W sekcji Summary wypunktuj najważniejsze zmiany oraz wskaż kluczowe pliki.
- W sekcji Testing wymień wszystkie komendy testowe wraz z krótkim opisem wyniku.

## Treści edukacyjne
- Podając fakty historyczne, dodawaj źródła w komentarzach lub dokumentacji, gdy to możliwe.
- Zwracaj uwagę na poprawną terminologię (np. skryptorium, pergamin, iluminator) i pisownię polską.
