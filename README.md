# Automatización de OrangeHRM con Playwright

Proyecto de ejemplo para automatizar el inicio de sesión de
[OrangeHRM Demo](https://opensource-demo.orangehrmlive.com/) con Playwright,
TypeScript y Azure Pipelines.

## Escenarios incluidos

- Inicio de sesión exitoso con las credenciales públicas de demostración.
- Validación del mensaje para credenciales inválidas.
- Evidencias automáticas cuando falla una prueba: captura, video y trace.
- Reportes HTML y JUnit.

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
├── azure-pipelines.yml     # Pipeline CI
├── playwright.config.ts    # Configuración de pruebas y reportes
└── tsconfig.json           # Configuración TypeScript
```

## Pipeline

El pipeline se ejecuta en cambios y pull requests hacia `main`. Instala Node.js
y Chromium, valida TypeScript, ejecuta las pruebas y publica:

- resultados JUnit;
- reporte HTML;
- capturas, videos y traces disponibles en `test-results`.
