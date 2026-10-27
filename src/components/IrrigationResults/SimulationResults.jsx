import React from "react";
import V1Results from "./V1Results.jsx";
import V2Results from "./V2Results.jsx";
import { V1_CONTRACT } from "../../utils/irrigationV1Results.js";
import { V2_CONTRACT } from "../../utils/irrigationV2Results.js";
import s from "./V2Results.module.scss";

export default function SimulationResults({ snapshot }) {
  const version = snapshot?.model?.contractVersion;
  if (version === V1_CONTRACT) return <V1Results snapshot={snapshot} />;
  if (version === V2_CONTRACT) return <V2Results snapshot={snapshot} />;
  return <section className={s.invalid}><h1>{typeof version === "string" ? "Versión contractual no soportada" : "No se pueden presentar estos resultados"}</h1><p role="alert">No se interpretan resultados por sus campos ni por la versión activa del servidor. Los datos recibidos no identifican un contrato compatible.</p></section>;
}
