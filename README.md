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

## API y sesión

El frontend consulta `VITE_API_URL` y, si no está definida, usa
`http://localhost:4000` para desarrollo local. Copiar `.env.example` a `.env`
permite configurar otro backend sin cambiar los endpoints existentes. No
versionar `.env` ni colocar secretos en variables `VITE_`, porque se incluyen
en el bundle del navegador.

La sesión actual guarda el JWT en `localStorage`. `ProtectedRoute` comprueba
únicamente si hay un token; no valida su expiración. Si caduca, la ruta puede
seguir visible y las llamadas protegidas mostrarán el error devuelto por la
API. El manejo de expiración y cierre de sesión queda pendiente para la fase
de sesión de producción.
