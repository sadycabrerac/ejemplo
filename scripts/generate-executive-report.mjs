import fs from 'node:fs';
import path from 'node:path';

const resultsFile = path.resolve('test-results/results.json');
const outputFile = path.resolve('test-results/executive-summary.md');

let stats = {
  duration: 0,
  expected: 0,
  flaky: 0,
  skipped: 0,
  unexpected: 0,
};

if (fs.existsSync(resultsFile)) {
  const report = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  stats = { ...stats, ...report.stats };
}

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

const report = `# Resumen ejecutivo — OrangeHRM

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

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, report);
console.log(report);
