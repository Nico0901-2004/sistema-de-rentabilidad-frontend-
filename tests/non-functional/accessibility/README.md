# NF-18 - Validacion accesibilidad basica UI

Prueba no funcional automatizada con Lighthouse CI para validar accesibilidad local del frontend React.

## Alcance

- Se ejecuta solo en local.
- No apunta al frontend desplegado ni a `main`.
- Usa el frontend QA local en `http://localhost:3001`.
- Usa el backend QA local en `http://localhost:3000` para autenticar rutas protegidas.
- Audita rutas publicas y rutas protegidas con rol propietario.
- No guarda credenciales, tokens ni cookies en archivos versionados.

## Rutas auditadas

```txt
/login
/dashboard
/proyectos
/usuarios
/servicios
/proyectos/{LHCI_PROJECT_ID}/fases
```

Por defecto `LHCI_PROJECT_ID=1`.

## Variables de entorno

La prueba lee `.env.qa` automaticamente. Tambien se puede sobrescribir con variables de entorno:

```txt
LHCI_BASE_URL=http://localhost:3001
LHCI_BACKEND_URL=http://localhost:3000
LHCI_PROJECT_ID=1
LHCI_AUTH_EMAIL=qa_propietario@test.com
LHCI_AUTH_PASSWORD=<password-no-versionar>
LHCI_NUMBER_OF_RUNS=1
```

Si no se definen `LHCI_AUTH_EMAIL` y `LHCI_AUTH_PASSWORD`, se usan `QA_PROPIETARIO_EMAIL` y `QA_USER_PASSWORD` desde `.env.qa`.

## Preparacion

Instalar dependencias:

```bash
npm install
```

Preparar datos QA si es necesario:

```bash
npm run qa:seed
```

Levantar backend QA en una terminal separada:

```bash
npm --prefix ../Sistema-de-Rentabilidad-Backend- run dev:qa
```

Levantar frontend QA en otra terminal separada:

```bash
npm run start:qa
```

Por defecto la prueba asume que ambos servidores ya estan levantados. Si se quiere que Lighthouse CI intente levantar el frontend, ejecutar con `LHCI_START_SERVER=true`.

## Ejecucion

```bash
npm run test:nf:accessibility
```

La prueba:

1. Usa el frontend local ya levantado.
2. Audita `/login` sin sesion.
3. Inicia sesion una sola vez como propietario para rutas protegidas.
4. Audita las rutas configuradas.
5. Falla si alguna ruta obtiene accessibility menor a 80.
6. Guarda reportes en `tests/non-functional/accessibility/reports`.

## Criterios de aprobacion

NF-18 aprueba si:

- Lighthouse CI ejecuta correctamente.
- El frontend local carga en `http://localhost:3001`.
- El login como propietario funciona.
- Las rutas protegidas no redirigen a `/login`.
- Cada ruta obtiene `accessibility >= 0.8`.
- Se generan reportes locales.

NF-18 falla si:

- Alguna ruta obtiene `accessibility < 0.8`.
- Lighthouse no puede abrir una URL local.
- El backend local no permite autenticar.
- Una ruta protegida redirige a `/login`.
- Una pagina queda en blanco o con error.
- No se genera reporte.

## Evidencia

Completar `evidence-template.md` y adjuntar:

- Captura del resultado en terminal.
- Reporte HTML o JSON generado por Lighthouse CI.
- URLs auditadas.
- Fecha y hora de ejecucion.
- Usuario/rol usado, sin registrar password.
- Score obtenido por ruta.
- Resultado final: aprobado o rechazado.

## Problemas comunes

- Backend QA apagado o con `.env.qa` incorrecto.
- Datos QA no sembrados.
- Credenciales de propietario invalidas.
- Rate limit de login activado por ejecuciones repetidas. Esperar el tiempo indicado por el backend o reiniciar datos QA antes de reintentar.
- Proyecto `LHCI_PROJECT_ID` inexistente.
- Puerto `3001` ocupado por otro frontend.
- Bajo contraste, inputs sin label, botones sin nombre accesible, `aria` incorrecto u orden de headings inconsistente.
