import React, { useMemo, useState } from "react";
import s from "./Calculator.module.scss";
import { manningQ, geometries } from "../../utils/manning.js";
import Tooltip from "../Tooltip/Tooltip.jsx";
const roughnessPresets = [
  { label: "Hormigón alisado (0.012)", value: 0.012 },
  { label: "Hormigón rugoso (0.015)", value: 0.015 },
  { label: "Tierra alisada (0.020)", value: 0.02 },
  { label: "Canal natural (0.030)", value: 0.03 },
  { label: "Personalizado", value: "custom" },
];

export default function Calculator() {
  const [channel, setChannel] = useState("rectangular");
  const [nPreset, setNPreset] = useState(roughnessPresets[0].value);
  const [n, setN] = useState(0.012);
  const [S, setS] = useState(0.001);

  // geometry fields
  const [b, setB] = useState(1);
  const [h, setH] = useState(0.5);
  const [z, setZ] = useState(1);
  const [errors, setErrors] = useState({});

  const usingCustomN = nPreset === "custom";
  const nValue = usingCustomN ? Number(n) : Number(nPreset);
  const hasErrors = Object.keys(errors).length > 0;

  const { A, P } = useMemo(() => {
    const params = { b: Number(b), h: Number(h), z: Number(z) };
    return geometries[channel](params);
  }, [channel, b, h, z]);

  const Q = useMemo(() => {
    if (hasErrors) return 0;
    return manningQ({ A, P, n: Number(nValue), S: Number(S) });
  }, [A, P, nValue, S, hasErrors]);

  const exportCSV = () => {
    const rows = [
      ["Canal", channel],
      ["n (Manning)", nValue],
      ["S (pendiente, m/m)", S],
      ["A (m2)", A],
      ["P (m)", P],
      ["Q (m3/s)", Q],
      ["Q (L/s)", Q * 1000],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caudal_${channel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = Number(value);

    const stateUpdaters = {
      b: setB,
      h: setH,
      z: setZ,
      S: setS,
      n: setN,
    };
    if (stateUpdaters[name]) {
      stateUpdaters[name](value);
    }

    let newErrors = { ...errors };

    if (["b", "h", "S", "n"].includes(name)) {
      if (numValue <= 0) {
        newErrors[name] = "El valor debe ser mayor a cero.";
      } else {
        delete newErrors[name];
      }
    }

    // CORRECCIÓN: La regla para 'z' debe estar fuera del if anterior
    if (name === "z") {
      if (numValue < 0) {
        newErrors[name] = "El valor no puede ser negativo.";
      } else {
        delete newErrors[name];
      }
    }

    setErrors(newErrors);
  };

  // --- EL RETURN DEBE ESTAR AQUÍ, AL FINAL DEL COMPONENTE ---
  return (
    <section id="calculator" className={s.section}>
      <div className="container">
        <h2 className={s.title}>Calculadora de Caudal</h2>
        <p className={s.lead}>
          Utilizá la fórmula de Manning para calcular el caudal en canales de
          riego con diferentes geometrías y materiales.
        </p>

        <div className={s.grid}>
          <div className={s.card}>
            <h3 className={s.cardTitle}>Configuración del Canal</h3>
            <label className={s.field}>
              <span>Tipo de canal</span>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="rectangular">Rectangular</option>
                <option value="triangular">Triangular</option>
                <option value="trapezoidal">Trapezoidal</option>
              </select>
            </label>

            <label className={s.field}>
              <span>
                Rugosidad de Manning (n){" "}
                <Tooltip text="Este coeficiente representa la 'aspereza' del material del canal. Un valor más alto significa más fricción y menor velocidad del agua." />
              </span>

              <select
                value={nPreset}
                onChange={(e) => setNPreset(e.target.value)}
              >
                {roughnessPresets.map((r) => (
                  <option key={r.label} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            {usingCustomN && (
              <label className={s.field}>
                <span>n personalizado</span>
                <input
                  type="number"
                  step="0.001"
                  name="n" // <-- Añadí el name para la validación
                  value={n}
                  onChange={handleInputChange}
                />
                {errors.n && <span className={s.errorText}>{errors.n}</span>}
              </label>
            )}

            <label className={s.field}>
              <span>
                Pendiente S (m/m)
                <Tooltip text="Es la inclinación longitudinal del canal. Se expresa como metros de caída vertical por cada metro de distancia horizontal (ej: 0.001)." />
              </span>
              <input
                type="number"
                step="0.0001"
                name="S" // <-- Añadí el name para la validación
                value={S}
                onChange={handleInputChange}
              />
              {errors.S && <span className={s.errorText}>{errors.S}</span>}
            </label>

            {channel !== "triangular" && (
              <label className={s.field}>
                <span>Ancho de fondo b (m)</span>
                <input
                  type="number"
                  step="0.01"
                  name="b" // <-- Añadí el name para la validación
                  value={b}
                  onChange={handleInputChange}
                />
                {errors.b && <span className={s.errorText}>{errors.b}</span>}
              </label>
            )}

            <label className={s.field}>
              <span>Profundidad h (m)</span>
              <input
                type="number"
                step="0.01"
                name="h" // <-- Añadí el name para la validación
                value={h}
                onChange={handleInputChange}
              />
              {errors.h && <span className={s.errorText}>{errors.h}</span>}
            </label>

            {channel !== "rectangular" && (
              <label className={s.field}>
                <span>
                  Pendiente lateral z (H:V)
                  <Tooltip text="Relación entre la distancia horizontal (H) y vertical (V) del talud o borde del canal. Un valor de 1.5 significa 1.5m en horizontal por cada 1m en vertical." />
                </span>
                <input
                  type="number"
                  step="0.1"
                  name="z" // <-- Añadí el name para la validación
                  value={z}
                  onChange={handleInputChange}
                />
                {errors.z && <span className={s.errorText}>{errors.z}</span>}
              </label>
            )}

            {hasErrors && (
              <div className={s.warningText}>
                Por favor, corrige los errores antes de exportar.
              </div>
            )}

            <button
              className={s.csvBtn}
              type="button"
              onClick={exportCSV}
              disabled={hasErrors}
            >
              Exportar Resultados CSV
            </button>
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
              <div className={s.kpi + " " + s.kpiHighlight}>
                <div className={s.kpiLabel}>Q (m³/s)</div>
                <div className={s.kpiValue}>{Q.toFixed(6)}</div>
              </div>
              <div className={s.kpi + " " + s.kpiHighlight}>
                <div className={s.kpiLabel}>Q (L/s)</div>
                <div className={s.kpiValue}>{(Q * 1000).toFixed(1)}</div>
              </div>
            </div>

            <div className={s.panel}>
              <div className={s.panelTitle}>Fórmula de Manning:</div>
              <div className={s.code}>Q = (1/n) × A × R^(2/3) × S^(1/2)</div>
              <p className={s.help}>
                Asegurate de ingresar la pendiente S como valor adimensional
                (m/m).
              </p>
            </div>

            <div className={s.panel}>
              <div className={s.panelTitle}>Geometrías de Canal</div>
              <ul className={s.geometry}>
                <li>
                  <b>Rectangular:</b> A = b·h ; P = b + 2·h
                </li>
                <li>
                  <b>Triangular:</b> A = z·h² ; P = 2·h·√(1+z²)
                </li>
                <li>
                  <b>Trapezoidal:</b> A = b·h + z·h² ; P = b + 2·h·√(1+z²)
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className={s.reco + " u-card"}>
          <h3>Recomendaciones de Campo</h3>
          <ul>
            <li>
              Verificá la uniformidad del tramo y que el flujo sea permanente.
            </li>
            <li>Medí la pendiente S con nivelación o herramientas GNSS.</li>
            <li>Ajustá el coeficiente n según el mantenimiento del canal.</li>
            <li>Considerá bordes libres para evitar desbordamientos.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
