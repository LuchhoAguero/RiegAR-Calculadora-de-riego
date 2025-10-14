# RiegAR (React + SCSS)

Conversión del prototipo Next/Tailwind a **React + Vite + SCSS Modules (BEM-like)**.

## Estructura

```
src/
  assets/
    images/...
  components/
    Navbar/
    Hero/
    Calculator/
    Footer/
  styles/
    _variables.scss
    _mixins.scss
    _globals.scss
  utils/
    manning.js
  App.jsx
  main.jsx
```

## Scripts

- `pnpm i` / `npm i`
- `pnpm dev` / `npm run dev`

## Notas

- Sin dependencias de UI externas: todo es SCSS Modules.
- Tokens en `src/styles/_variables.scss`.
- Lógica de la fórmula de Manning en `src/utils/manning.js`.
- Exportar CSV desde la calculadora.
- Diseño responsivo y accesible.
