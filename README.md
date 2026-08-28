# Automatización de OrangeHRM con Playwright

Proyecto de ejemplo para automatizar el inicio de sesión de
[OrangeHRM Demo](https://opensource-demo.orangehrmlive.com/) con Playwright,
TypeScript y GitHub Actions.

## Escenarios incluidos

- Inicio de sesión exitoso con las credenciales públicas de demostración.
- Validación del mensaje para credenciales inválidas.
- Evidencias automáticas cuando falla una prueba: captura, video y trace.
- Reportes HTML, JUnit y resumen ejecutivo.

## Requisitos

- Node.js 20 o superior.
- npm.

## Instalación

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env
```

## Ejecución

```bash
# Todas las pruebas
npm test

# Navegador visible
npm run test:headed

# Interfaz de Playwright
npm run test:ui

# Validación de TypeScript
npm run typecheck

# Abrir el último reporte HTML
npm run report

# Generar el resumen ejecutivo
npm run report:executive
```

Las variables `ORANGEHRM_BASE_URL`, `ORANGEHRM_USERNAME` y
`ORANGEHRM_PASSWORD` pueden modificarse en `.env`. Los valores incluidos son
credenciales públicas del entorno de demostración; para otros ambientes se
deben configurar variables seguras en el pipeline.

## Estructura

```text
.
├── pages/                  # Page Objects
├── tests/                  # Especificaciones Playwright
├── scripts/                # Generación del resumen ejecutivo
├── .github/workflows/      # Pipeline de GitHub Actions
├── playwright.config.ts    # Configuración de pruebas y reportes
└── tsconfig.json           # Configuración TypeScript
```

## Pipeline

GitHub Actions ejecuta el pipeline en cambios y pull requests hacia `main`, y
también permite iniciarlo manualmente. Instala Node.js y Chromium, valida
TypeScript, ejecuta las pruebas y publica:

- resumen ejecutivo en la página de la ejecución y como artefacto;
- resultados JUnit dentro del artefacto ejecutivo;
- reporte HTML;
- capturas, videos y traces cuando existe un fallo.
