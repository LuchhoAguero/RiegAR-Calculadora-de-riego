import React, { useContext, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { IrrigationDraftContext } from "../context/IrrigationDraftContext.jsx";
import { ActiveWizard } from "../components/SimulationWizard/SimulationWizard.jsx";
import V2Results from "../components/IrrigationResults/V2Results.jsx";
import { academicReference, createAcademicDemoDraft } from "../utils/academicDemo.js";
import { ACADEMIC_DEMO_FORM_PATH, ACADEMIC_DEMO_RESULTS_PATH } from "../utils/irrigationAvailability.js";
import wizardStyles from "../components/SimulationWizard/SimulationWizard.module.scss";
import resultStyles from "../components/IrrigationResults/V2Results.module.scss";

const idleSubmission = Object.freeze({ status: "idle", fields: {} });

function AcademicWizard() {
  const { draft, discard } = useContext(IrrigationDraftContext);
  return <>
    <div className="container"><p>El asistente comienza con los datos del ejemplo oficial GV2-01. Podés editarlos para explorar los campos y sus validaciones.</p><button type="button" className={wizardStyles.secondary} onClick={discard}>Restablecer ejemplo oficial</button></div>
    <ActiveWizard farm={{ id: "demo", nombre_finca: draft.farmName }} academicDemo />
  </>;
}

function AcademicResults() {
  return <div className={`${resultStyles.demo} container`}>
    <Link className={resultStyles.backLink} to={ACADEMIC_DEMO_FORM_PATH}>Volver al asistente de demostración</Link>
    <aside className={resultStyles.demoNotice} aria-label="Procedencia de los resultados"><strong>Resultados del fixture oficial GV2-01</strong><p>Estos valores fijos provienen del ejemplo oficial. No se calcularon con tus cambios del asistente ni se guardaron en tu cuenta. Los identificadores y la fecha pertenecen al fixture.</p></aside>
    <V2Results snapshot={academicReference.snapshot} />
  </div>;
}

export default function AcademicDemoPage() {
  const [draft, setDraft] = useState(createAcademicDemoDraft);
  const reset = () => setDraft(createAcademicDemoDraft());
  return <IrrigationDraftContext.Provider value={{ draft, setDraft, discard: reset, submission: idleSubmission }}>
    <p role="note" className="demo-notice">Demostración académica V2 · datos de prueba · sin envíos ni guardado</p>
    <Routes>
      <Route index element={<Navigate to={ACADEMIC_DEMO_FORM_PATH} replace />} />
      <Route path="simulacion-v2" element={<AcademicWizard />} />
      <Route path="resultados-v2" element={<AcademicResults />} />
      <Route path="*" element={<div className="container"><h1>Demostración no encontrada</h1><p><Link to={ACADEMIC_DEMO_RESULTS_PATH}>Ver resultados de demostración</Link></p></div>} />
    </Routes>
  </IrrigationDraftContext.Provider>;
}
