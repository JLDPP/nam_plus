# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Ñam+ como PWA

Con la API en el puerto 4000, ejecuta `npm run build` y `npm run preview` desde el directorio del frontend. Abre `http://localhost:4173` en Chrome o Edge. El service worker se genera en la compilación de producción. Para instalar, usa **Configuración → Instalar Ñam+** o la opción de instalación del navegador.

Para el despliegue, publica `dist` por HTTPS y configura las rutas del frontend para que sirvan `index.html`. Las rutas de recursos y `/sw.js` deben seguir sirviendo sus archivos. Mantén el proxy de `/api` hacia el backend o define `VITE_API_URL` al compilar. La API necesita la misma conexión a MongoDB con soporte de transacciones que usa el flujo de canjes existente.

### Datos guardados en el dispositivo

Abre la app e inicia sesión con conexión al menos una vez. Las vistas consultadas se guardan por cuenta en el navegador. Los clientes pueden consultar saldo, movimientos, recompensas e historial guardados. Los restaurantes pueden consultar las recompensas y canjes que ya abrieron. Las fotos subidas a Ñam+ y cargadas por el service worker pueden estar disponibles sin conexión. Los cambios de cuenta, administración y canjes de recompensa requieren conexión.

Las compras y validaciones de cupón registradas sin internet aparecen en **Sincronización**. Mantén la app abierta al reconectar o ábrela de nuevo para enviarlas. Si el cupón se acepta, el servidor acredita los puntos. Si la compra se acepta, genera el cupón y hace un intento de envío por correo. Si el correo no se confirma, el código manual queda en el listado. Borrar los datos del sitio elimina las operaciones que todavía estén guardadas solo en ese dispositivo.
