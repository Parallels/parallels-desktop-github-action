const fs = require('fs')
const path = require('path')

const coverageSummaryPath = path.join(
  __dirname,
  '..',
  'coverage',
  'coverage-summary.json'
)
const outputPath = path.join(__dirname, '..', 'badges', 'coverage.svg')

function colorForPercentage(percentage) {
  if (percentage >= 90) return '#4c1'
  if (percentage >= 80) return '#97ca00'
  if (percentage >= 70) return '#a4a61d'
  if (percentage >= 60) return '#dfb317'
  if (percentage >= 50) return '#fe7d37'
  return '#e05d44'
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'))
const percentage = coverageSummary.total.statements.pct
const value = `${percentage.toFixed(2)}%`
const label = 'Coverage'
const labelWidth = 63
const valueWidth = 53
const width = labelWidth + valueWidth
const labelTextLength = labelWidth * 10 - 100
const valueTextLength = valueWidth * 10 - 100
const labelX = Math.round((labelWidth * 10) / 2)
const valueX = Math.round((labelWidth + valueWidth / 2) * 10)
const color = colorForPercentage(percentage)
const ariaLabel = `${label}: ${value}`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${escapeXml(ariaLabel)}"><title>${escapeXml(ariaLabel)}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${width}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${labelWidth}" height="20" fill="#555"/><rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/><rect width="${width}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110"><text aria-hidden="true" x="${labelX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${labelTextLength}">${escapeXml(label)}</text><text x="${labelX}" y="140" transform="scale(.1)" fill="#fff" textLength="${labelTextLength}">${escapeXml(label)}</text><text aria-hidden="true" x="${valueX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${valueTextLength}">${escapeXml(value)}</text><text x="${valueX}" y="140" transform="scale(.1)" fill="#fff" textLength="${valueTextLength}">${escapeXml(value)}</text></g></svg>`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${svg}\n`)
