import React, { useMemo, useState } from 'react'
import s from './Calculator.module.scss'
import { manningQ, geometries } from '../../utils/manning.js'

const roughnessPresets = [
  { label: 'Hormigón alisado (0.012)', value: 0.012 },
  { label: 'Hormigón rugoso (0.015)', value: 0.015 },
  { label: 'Tierra alisada (0.020)', value: 0.020 },
  { label: 'Canal natural (0.030)', value: 0.030 },
  { label: 'Personalizado', value: 'custom' }
]

export default function Calculator(){
  const [channel, setChannel] = useState('rectangular')
  const [nPreset, setNPreset] = useState(roughnessPresets[0].value)
  const [n, setN] = useState(0.012)
  const [S, setS] = useState(0.001)

  // geometry fields
  const [b, setB] = useState(1)
  const [h, setH] = useState(0.5)
  const [z, setZ] = useState(1)

  const usingCustomN = nPreset === 'custom'
  const nValue = usingCustomN ? Number(n) : Number(nPreset)

  const { A, P } = useMemo(() => {
    const params = { b: Number(b), h: Number(h), z: Number(z) }
    return geometries[channel](params)
  }, [channel, b, h, z])

  const Q = useMemo(() => {
    return manningQ({ A, P, n: Number(nValue), S: Number(S) })
  }, [A, P, nValue, S])

  const exportCSV = () => {
    const rows = [
      ['Canal', channel],
      ['n (Manning)', nValue],
      ['S (pendiente, m/m)', S],
      ['A (m2)', A],
      ['P (m)', P],
      ['Q (m3/s)', Q],
      ['Q (L/s)', Q*1000],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `caudal_${channel}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section id="calculator" className={s.section}>
      <div className="container">
        <h2 className={s.title}>Calculadora de Caudal</h2>
        <p className={s.lead}>Utilizá la fórmula de Manning para calcular el caudal en canales de riego con diferentes geometrías y materiales.</p>

        <div className={s.grid}>
          {/* Config */}
          <div className={s.card}>
            <h3 className={s.cardTitle}>Configuración del Canal</h3>

            {/* Tipo de canal */}
            <label className={s.field}>
              <span>Tipo de canal</span>
              <select value={channel} onChange={(e)=>setChannel(e.target.value)}>
                <option value="rectangular">Rectangular</option>
                <option value="triangular">Triangular</option>
                <option value="trapezoidal">Trapezoidal</option>
              </select>
            </label>

            {/* Rugosidad */}
            <label className={s.field}>
              <span>Rugosidad de Manning (n)</span>
              <select value={nPreset} onChange={(e)=>setNPreset(e.target.value)}>
                {roughnessPresets.map((r) => (
                  <option key={r.label} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
            {usingCustomN && (
              <label className={s.field}>
                <span>n personalizado</span>
                <input type="number" step="0.001" value={n} onChange={(e)=>setN(e.target.value)} />
              </label>
            )}

            <label className={s.field}>
              <span>Pendiente S (m/m)</span>
              <input type="number" step="0.0001" value={S} onChange={(e)=>setS(e.target.value)} />
            </label>

            {/* Geometría */}
            {channel !== 'triangular' && (
              <label className={s.field}>
                <span>Ancho de fondo b (m)</span>
                <input type="number" step="0.01" value={b} onChange={(e)=>setB(e.target.value)} />
              </label>
            )}
            <label className={s.field}>
              <span>Profundidad h (m)</span>
              <input type="number" step="0.01" value={h} onChange={(e)=>setH(e.target.value)} />
            </label>
            {channel !== 'rectangular' && (
              <label className={s.field}>
                <span>Pendiente lateral z (H:V)</span>
                <input type="number" step="0.1" value={z} onChange={(e)=>setZ(e.target.value)} />
              </label>
            )}

            <button className={s.csvBtn} type="button" onClick={exportCSV}>Exportar Resultados CSV</button>
          </div>

          {/* Results */}
          <div className={s.card}>
            <h3 className={s.cardTitle}>Resultados del Cálculo</h3>
            <div className={s.kpis}>
              <div className={s.kpi}>
                <div className={s.kpiLabel}>Área A (m²)</div>
                <div className={s.kpiValue}>{(A || 0).toFixed(3)}</div>
              </div>
              <div className={s.kpi}>
                <div className={s.kpiLabel}>Perímetro P (m)</div>
                <div className={s.kpiValue}>{(P || 0).toFixed(3)}</div>
              </div>
              <div className={s.kpi + ' ' + s.kpiHighlight}>
                <div className={s.kpiLabel}>Q (m³/s)</div>
                <div className={s.kpiValue}>{Q.toFixed(6)}</div>
              </div>
              <div className={s.kpi + ' ' + s.kpiHighlight}>
                <div className={s.kpiLabel}>Q (L/s)</div>
                <div className={s.kpiValue}>{(Q*1000).toFixed(1)}</div>
              </div>
            </div>

            <div className={s.panel}>
              <div className={s.panelTitle}>Fórmula de Manning:</div>
              <div className={s.code}>Q = (1/n) × A × R^(2/3) × S^(1/2)</div>
              <p className={s.help}>Asegurate de ingresar la pendiente S como valor adimensional (m/m).</p>
            </div>

            <div className={s.panel}>
              <div className={s.panelTitle}>Geometrías de Canal</div>
              <ul className={s.geometry}>
                <li><b>Rectangular:</b> A = b·h ; P = b + 2·h</li>
                <li><b>Triangular:</b> A = z·h² ; P = 2·h·√(1+z²)</li>
                <li><b>Trapezoidal:</b> A = b·h + z·h² ; P = b + 2·h·√(1+z²)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={s.reco + ' u-card'}>
          <h3>Recomendaciones de Campo</h3>
          <ul>
            <li>Verificá la uniformidad del tramo y que el flujo sea permanente.</li>
            <li>Medí la pendiente S con nivelación o herramientas GNSS.</li>
            <li>Ajustá el coeficiente n según el mantenimiento del canal.</li>
            <li>Considerá bordes libres para evitar desbordamientos.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}