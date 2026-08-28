import fs from 'node:fs';
import path from 'node:path';

const resultsFile = path.resolve('test-results/results.json');
const summaryFile = path.resolve('test-results/executive-summary.md');
const dashboardFile = path.resolve('test-results/executive-report/index.html');

let playwrightReport = {
  suites: [],
  stats: {
    duration: 0,
    expected: 0,
    flaky: 0,
    skipped: 0,
    unexpected: 0,
  },
};

if (fs.existsSync(resultsFile)) {
  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  playwrightReport = {
    ...playwrightReport,
    ...results,
    stats: { ...playwrightReport.stats, ...results.stats },
  };
}

const { stats } = playwrightReport;
const passed = stats.expected;
const failed = stats.unexpected;
const total = passed + failed + stats.flaky + stats.skipped;
const executed = passed + failed + stats.flaky;
const successRate = executed === 0 ? 0 : ((passed + stats.flaky) / executed) * 100;
const duration = `${(stats.duration / 1000).toFixed(1)} s`;

let status = 'Sin resultados';
if (failed > 0) {
  status = 'Requiere atención';
} else if (stats.flaky > 0) {
  status = 'Aprobado con inestabilidad';
} else if (total > 0) {
  status = 'Aprobado';
}

const runUrl =
  process.env.GITHUB_SERVER_URL &&
  process.env.GITHUB_REPOSITORY &&
  process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : undefined;

const summary = `# Resumen ejecutivo — OrangeHRM

## Estado general: ${status}

| Indicador | Resultado |
| --- | ---: |
| Casos totales | ${total} |
| Exitosos | ${passed} |
| Fallidos | ${failed} |
| Inestables | ${stats.flaky} |
| Omitidos | ${stats.skipped} |
| Tasa de éxito | ${successRate.toFixed(1)}% |
| Duración | ${duration} |

**Alcance:** inicio de sesión válido e inválido en OrangeHRM Demo mediante Chromium.

${runUrl ? `[Ver ejecución y artefactos](${runUrl})` : 'Los detalles técnicos están disponibles en el reporte HTML de Playwright.'}
`;

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const scenarios = [];

const collectScenarios = (suites, groups = []) => {
  for (const suite of suites) {
    const nextGroups = suite.title.endsWith('.spec.ts')
      ? groups
      : [...groups, suite.title];

    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const result = test.results?.at(-1);
        scenarios.push({
          browser: test.projectName || 'chromium',
          duration: result?.duration ?? 0,
          group: nextGroups.join(' / '),
          name: spec.title,
          status: test.status,
        });
      }
    }

    collectScenarios(suite.suites ?? [], nextGroups);
  }
};

collectScenarios(playwrightReport.suites);

const statusLabel = {
  expected: 'Exitoso',
  flaky: 'Inestable',
  skipped: 'Omitido',
  unexpected: 'Fallido',
};

const scenarioRows = scenarios
  .map(
    (scenario) => `
            <tr>
              <td>
                <strong>${escapeHtml(scenario.name)}</strong>
                <span>${escapeHtml(scenario.group || 'OrangeHRM')}</span>
              </td>
              <td><span class="result result-${escapeHtml(scenario.status)}">${escapeHtml(statusLabel[scenario.status] ?? scenario.status)}</span></td>
              <td>${escapeHtml(scenario.browser)}</td>
              <td>${(scenario.duration / 1000).toFixed(1)} s</td>
            </tr>`,
  )
  .join('');

const generatedAt = new Intl.DateTimeFormat('es', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
}).format(new Date(stats.startTime ?? Date.now()));

const dashboard = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte ejecutivo | OrangeHRM</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3f6fb;
        --card: #ffffff;
        --ink: #172033;
        --muted: #667085;
        --line: #e5eaf2;
        --primary: #ff7b35;
        --primary-soft: #fff0e8;
        --success: #12a36d;
        --success-soft: #eafaf4;
        --danger: #d92d20;
        --danger-soft: #fff0ee;
        --warning: #d97706;
        --warning-soft: #fff7e6;
        --shadow: 0 18px 45px rgba(30, 44, 75, 0.09);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background:
          radial-gradient(circle at 10% 0%, rgba(255, 123, 53, 0.12), transparent 26rem),
          var(--bg);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .page {
        width: min(1180px, calc(100% - 40px));
        margin: 0 auto;
        padding: 38px 0 52px;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 28px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 0.02em;
      }

      .brand-mark {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        border-radius: 12px;
        background: var(--primary);
        color: #fff;
        box-shadow: 0 9px 24px rgba(255, 123, 53, 0.3);
      }

      .generated {
        color: var(--muted);
        font-size: 13px;
      }

      .hero {
        display: grid;
        grid-template-columns: 1.5fr 0.7fr;
        gap: 22px;
        min-height: 275px;
        padding: 36px;
        overflow: hidden;
        border-radius: 24px;
        background: linear-gradient(135deg, #172033 0%, #222f49 72%, #31405d 100%);
        color: #fff;
        box-shadow: var(--shadow);
      }

      .eyebrow {
        margin: 0 0 13px;
        color: #ffb58e;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      }

      h1 {
        max-width: 650px;
        margin: 0;
        font-size: clamp(34px, 5vw, 57px);
        line-height: 1.05;
        letter-spacing: -0.045em;
      }

      .hero-copy {
        max-width: 630px;
        margin: 20px 0 0;
        color: #cdd5e4;
        font-size: 16px;
        line-height: 1.65;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 24px;
        padding: 8px 12px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 13px;
        font-weight: 700;
      }

      .badge::before {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${failed > 0 ? '#ff7066' : '#52d6a5'};
        content: "";
        box-shadow: 0 0 0 4px ${failed > 0 ? 'rgba(255, 112, 102, 0.15)' : 'rgba(82, 214, 165, 0.15)'};
      }

      .score-wrap {
        display: grid;
        place-items: center;
      }

      .score {
        position: relative;
        display: grid;
        width: 190px;
        height: 190px;
        place-items: center;
        border-radius: 50%;
        background: conic-gradient(var(--primary) ${successRate}%, rgba(255, 255, 255, 0.11) 0);
      }

      .score::after {
        position: absolute;
        width: 148px;
        height: 148px;
        border-radius: 50%;
        background: #222f49;
        content: "";
      }

      .score-value {
        position: relative;
        z-index: 1;
        text-align: center;
      }

      .score-value strong {
        display: block;
        font-size: 42px;
        letter-spacing: -0.05em;
      }

      .score-value span {
        color: #aab6ca;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .metrics {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin: 22px 0;
      }

      .card {
        padding: 22px;
        border: 1px solid rgba(229, 234, 242, 0.8);
        border-radius: 18px;
        background: var(--card);
        box-shadow: 0 8px 28px rgba(30, 44, 75, 0.055);
      }

      .metric-label {
        color: var(--muted);
        font-size: 12px;
        font-weight: 750;
        letter-spacing: 0.07em;
        text-transform: uppercase;
      }

      .metric-value {
        display: block;
        margin-top: 10px;
        font-size: 31px;
        font-weight: 850;
        letter-spacing: -0.035em;
      }

      .metric-detail {
        display: block;
        margin-top: 5px;
        color: var(--muted);
        font-size: 12px;
      }

      .content-grid {
        display: grid;
        grid-template-columns: 1.6fr 0.7fr;
        gap: 22px;
      }

      .section-card {
        overflow: hidden;
        border: 1px solid rgba(229, 234, 242, 0.8);
        border-radius: 20px;
        background: var(--card);
        box-shadow: 0 8px 28px rgba(30, 44, 75, 0.055);
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 22px 24px;
        border-bottom: 1px solid var(--line);
      }

      h2 {
        margin: 0;
        font-size: 17px;
        letter-spacing: -0.015em;
      }

      .section-meta {
        color: var(--muted);
        font-size: 12px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 17px 24px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        font-size: 13px;
      }

      th {
        color: var(--muted);
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      tr:last-child td {
        border-bottom: 0;
      }

      td strong,
      td span {
        display: block;
      }

      td > span:not(.result) {
        margin-top: 4px;
        color: var(--muted);
        font-size: 11px;
      }

      .result {
        display: inline-flex;
        width: fit-content;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
      }

      .result-expected {
        background: var(--success-soft);
        color: var(--success);
      }

      .result-unexpected {
        background: var(--danger-soft);
        color: var(--danger);
      }

      .result-flaky {
        background: var(--warning-soft);
        color: var(--warning);
      }

      .result-skipped {
        background: #f2f4f7;
        color: var(--muted);
      }

      .insights {
        padding: 24px;
      }

      .insight {
        padding: 16px 0;
        border-bottom: 1px solid var(--line);
      }

      .insight:first-child {
        padding-top: 0;
      }

      .insight:last-child {
        padding-bottom: 0;
        border: 0;
      }

      .insight-label {
        color: var(--muted);
        font-size: 11px;
        font-weight: 750;
        letter-spacing: 0.07em;
        text-transform: uppercase;
      }

      .insight-value {
        display: block;
        margin-top: 7px;
        font-size: 14px;
        font-weight: 750;
        line-height: 1.5;
      }

      footer {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;
        color: var(--muted);
        font-size: 12px;
      }

      @media (max-width: 820px) {
        .hero,
        .content-grid {
          grid-template-columns: 1fr;
        }

        .metrics {
          grid-template-columns: repeat(2, 1fr);
        }

        .score-wrap {
          justify-content: start;
        }
      }

      @media (max-width: 560px) {
        .page {
          width: min(100% - 24px, 1180px);
          padding-top: 20px;
        }

        .topbar,
        footer {
          align-items: flex-start;
          flex-direction: column;
          gap: 8px;
        }

        .hero {
          padding: 26px;
        }

        .metrics {
          grid-template-columns: 1fr;
        }

        th:nth-child(3),
        td:nth-child(3) {
          display: none;
        }

        th,
        td {
          padding: 15px;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark">OH</span>
          ORANGEHRM · QUALITY REPORT
        </div>
        <span class="generated">Ejecución: ${escapeHtml(generatedAt)} UTC</span>
      </header>

      <section class="hero">
        <div>
          <p class="eyebrow">Reporte ejecutivo de automatización</p>
          <h1>Calidad del inicio de sesión</h1>
          <p class="hero-copy">
            Validación automatizada del acceso exitoso y del control de credenciales
            inválidas sobre OrangeHRM Demo.
          </p>
          <span class="badge">${escapeHtml(status)}</span>
        </div>
        <div class="score-wrap">
          <div class="score">
            <div class="score-value">
              <strong>${successRate.toFixed(0)}%</strong>
              <span>Éxito</span>
            </div>
          </div>
        </div>
      </section>

      <section class="metrics" aria-label="Indicadores principales">
        <article class="card">
          <span class="metric-label">Casos totales</span>
          <strong class="metric-value">${total}</strong>
          <span class="metric-detail">Escenarios automatizados</span>
        </article>
        <article class="card">
          <span class="metric-label">Exitosos</span>
          <strong class="metric-value">${passed}</strong>
          <span class="metric-detail">Validaciones aprobadas</span>
        </article>
        <article class="card">
          <span class="metric-label">Fallidos</span>
          <strong class="metric-value">${failed}</strong>
          <span class="metric-detail">${failed === 0 ? 'Sin incidencias detectadas' : 'Requieren revisión'}</span>
        </article>
        <article class="card">
          <span class="metric-label">Duración</span>
          <strong class="metric-value">${duration}</strong>
          <span class="metric-detail">Tiempo total de ejecución</span>
        </article>
      </section>

      <section class="content-grid">
        <article class="section-card">
          <header class="section-header">
            <h2>Resultado por escenario</h2>
            <span class="section-meta">${scenarios.length} casos</span>
          </header>
          <div>
            <table>
              <thead>
                <tr>
                  <th>Escenario</th>
                  <th>Resultado</th>
                  <th>Navegador</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                ${scenarioRows || '<tr><td colspan="4">No se encontraron resultados.</td></tr>'}
              </tbody>
            </table>
          </div>
        </article>

        <aside class="section-card">
          <header class="section-header">
            <h2>Lectura ejecutiva</h2>
          </header>
          <div class="insights">
            <div class="insight">
              <span class="insight-label">Estado general</span>
              <strong class="insight-value">${escapeHtml(status)}</strong>
            </div>
            <div class="insight">
              <span class="insight-label">Cobertura funcional</span>
              <strong class="insight-value">Acceso válido y rechazo de credenciales inválidas</strong>
            </div>
            <div class="insight">
              <span class="insight-label">Entorno</span>
              <strong class="insight-value">OrangeHRM Demo · Chromium</strong>
            </div>
            <div class="insight">
              <span class="insight-label">Conclusión</span>
              <strong class="insight-value">${failed === 0 ? 'El flujo de autenticación cumple los controles automatizados.' : 'Se detectaron fallos que requieren análisis técnico.'}</strong>
            </div>
          </div>
        </aside>
      </section>

      <footer>
        <span>Generado automáticamente con Playwright</span>
        <span>Reporte ejecutivo · OrangeHRM</span>
      </footer>
    </main>
  </body>
</html>
`;

fs.mkdirSync(path.dirname(summaryFile), { recursive: true });
fs.mkdirSync(path.dirname(dashboardFile), { recursive: true });
fs.writeFileSync(summaryFile, summary);
fs.writeFileSync(dashboardFile, dashboard);
console.log(summary);
console.log(`Dashboard: ${dashboardFile}`);
