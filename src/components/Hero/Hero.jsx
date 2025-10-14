import React from "react";
import s from "./Hero.module.scss";
import { Link } from "react-router-dom";
export default function Hero() {
  return (
    <section className={s.hero}>
      <div className={s.bg} aria-hidden="true" />
      <div className="container">
        <div className={s.grid}>
          <div className={s.content}>
            <div className={s.logoRow}>
              <div className={s.logo} />
              <h1 className={s.title}>
                Optimizá tu sistema de riego con cálculos precisos
              </h1>
              <p className={s.subtitle}>
                Calculadora profesional basada en la fórmula de Manning para
                determinar caudales en canales de riego. Diseñada para
                ingenieros agrónomos, técnicos en riego y profesionales del
                sector agrícola.
              </p>
              <div className={s.cta}>
                <Link className={s.btnPrimary} to="/calculadora">
                  Comenzar Cálculo
                </Link>
                <Link className={s.btnGhost} to="/guia">
                  Ver Guía de Uso
                </Link>
              </div>
              <div className={s.stats}>
                <div>
                  <div className={s.statValue}>3</div>
                  <div className={s.statLabel}>Tipos de Canal</div>
                </div>
                <div>
                  <div className={s.statValue}>Manning</div>
                  <div className={s.statLabel}>Fórmula Estándar</div>
                </div>
                <div>
                  <div className={s.statValue}>Precisión</div>
                  <div className={s.statLabel}>Profesional</div>
                </div>
              </div>
            </div>
          </div>
          <div className={s.visual}>
            <div className={s.formula}>
              <div className={s.formulaTitle}>Fórmula de Manning</div>
              <div className={s.expr}>Q = (1/n) × A × R^(2/3) × S^(1/2)</div>
              <div className={s.vars}>
                <div>
                  <b>Q:</b> Caudal (m³/s)
                </div>
                <div>
                  <b>n:</b> Coef. Manning
                </div>
                <div>
                  <b>A:</b> Área (m²)
                </div>
                <div>
                  <b>R:</b> Radio hidráulico
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
