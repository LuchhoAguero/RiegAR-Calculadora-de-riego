import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, Navigate, useBeforeUnload, useBlocker, useNavigate } from "react-router-dom";
import { FaSeedling, FaLayerGroup, FaStream, FaTint, FaClipboardCheck } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { IrrigationDraftContext } from "../../context/IrrigationDraftContext.jsx";
import useOwnedFarm from "../../hooks/useOwnedFarm.js";
import Modal from "../Modal/Modal.jsx";
import { STEPS, buildV2Payload, fieldId, parseNumber, reviewValue, validateValues } from "../../utils/irrigationV2Form.js";
import s from "./SimulationWizard.module.scss";
import farmStyles from "../FarmDetail/FarmDetail.module.scss";
import { isSimulationSandbox } from "../../utils/irrigationAvailability.js";
import SubmissionStatus from "../SimulationSubmission/SubmissionStatus.jsx";

const ICONS = [FaSeedling, FaLayerGroup, FaStream, FaTint, FaClipboardCheck];
function focusVisible(element) {
  if (!element) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
}

function Field({ field, raw, resolution, error, onChange, onBlur, onResolve }) {
  const id = fieldId(field.path);
  const parsed = field.type === "number" ? parseNumber(raw, { integer: field.integer, resolution }) : null;
  const ambiguous = parsed?.status === "ambiguous";
  const help = field.help || `Valor ${field.exclusiveMin ? "mayor que" : "desde"} ${field.min}${field.max !== undefined ? ` hasta ${field.max}` : ""}.`;
  return <div className={s.field}>
    <label htmlFor={id}>{field.label}{field.unit && <span> ({field.unit})</span>} {field.optional ? <small>Opcional</small> : <span aria-hidden="true">*</span>}</label>
    <input id={id} name={field.path} type="text" value={raw} onChange={event => onChange(event.target.value)} onBlur={onBlur}
      inputMode={field.type === "number" ? field.integer ? "numeric" : "decimal" : "text"}
      autoComplete="off" spellCheck={false} aria-required={!field.optional} aria-invalid={Boolean(error || ambiguous)}
      aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}${ambiguous ? ` ${id}-ambiguity` : ""}`} />
    <p id={`${id}-help`} className={s.hint}>{help}</p>
    {ambiguous && <div className={s.ambiguity} id={`${id}-ambiguity`} role="group" aria-label={`Aclarar ${field.label}`}>
      <p><strong>¿Qué número querés ingresar?</strong> {parsed.message}</p>
      <button type="button" onClick={() => onResolve("decimal")}>Usar como decimal: {parsed.choices.decimal.replace(".", ",")} {field.unit}</button>
      <button type="button" onClick={() => onResolve("integer")}>Usar como entero: {parsed.choices.integer} {field.unit}</button>
      <button type="button" onClick={() => focusVisible(document.getElementById(id))}>Editar el número</button>
    </div>}
    {resolution?.raw === raw && parsed?.status === "valid" && <p className={s.hint} role="status">Se usará {parsed.text.replace(".", ",")} {field.unit}.</p>}
    {error && <p id={`${id}-error`} className={s.fieldError}>{error}</p>}
  </div>;
}

function ActiveWizard({ farm, sessionToken }) {
  const { draft, setDraft, discard, submission, submit, clearField } = useContext(IrrigationDraftContext);
  const { isLoggedIn } = useContext(AuthContext);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [preparedSignature, setPreparedSignature] = useState(null);
  const title = useRef(null);
  const step = draft.step, current = STEPS[step], Icon = ICONS[step];
  const validation = validateValues(draft.values, draft.resolutions, step);
  const complete = buildV2Payload(draft.values, draft.resolutions);
  const signature = JSON.stringify([draft.values, draft.resolutions]);
  const dirty = Object.values(draft.values).some(value => value !== "");
  const sandbox = isSimulationSandbox();
  const locked = ["pending", "uncertain"].includes(submission.status);
  const sessionCurrent = () => isLoggedIn && localStorage.getItem("token") === sessionToken;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => sessionCurrent() && dirty &&
    (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  useBeforeUnload(event => {
    if (dirty && sessionCurrent()) { event.preventDefault(); event.returnValue = ""; }
  });

  useEffect(() => { focusVisible(title.current); setSubmitted(false); }, [step]);
  const update = (path, value) => { clearField(path); setDraft(previous => {
    const resolutions = { ...previous.resolutions }; delete resolutions[path];
    return { ...previous, values: { ...previous.values, [path]: value }, resolutions };
  }); };
  const resolve = (path, kind) => {
    setDraft(previous => ({ ...previous, resolutions: { ...previous.resolutions, [path]: { raw: previous.values[path], kind } } }));
    focusVisible(document.getElementById(fieldId(path)));
  };
  const go = target => setDraft(previous => ({ ...previous, step: target, reached: Math.max(target, previous.reached) }));
  const continueStep = event => {
    event.preventDefault();
    if (Object.keys(validation.errors).length) {
      setSubmitted(true);
      requestAnimationFrame(() => focusVisible(document.getElementById(fieldId(Object.keys(validation.errors)[0]))));
    } else go(step + 1);
  };
  const prepare = () => {
    setSubmitted(true);
    if (complete.ok) setPreparedSignature(signature);
    else requestAnimationFrame(() => focusVisible(document.getElementById("v2-review-errors")));
  };
  const leave = shouldDiscard => {
    // Navegar primero; el proveedor permanece montado y puede vaciarse sin reiniciar el asistente.
    blocker.proceed();
    if (shouldDiscard) discard();
  };

  return <div className={`${s.wizard} container`}>
    <nav className={s.breadcrumb} aria-label="Ubicación del asistente"><Link to="/fincas">Mis fincas</Link><span aria-hidden="true">/</span><Link to={`/fincas/${farm.id}`}>Detalle de finca</Link></nav>
    <header className={s.header}><p className={s.eyebrow}>{sandbox ? "Preparación local · API simulada" : "Preparación local · sin envíos"}</p><h1>Nueva simulación de riego por surcos</h1><p>Finca: <strong>{farm.nombre_finca}</strong></p></header>
    <aside className={s.notice} aria-label="Disponibilidad y borrador"><strong>{sandbox ? "Ensayo con API simulada. No se guardan datos reales." : "Solo preparación local. No se puede calcular ni guardar."}</strong><p>Los datos se conservan en memoria durante esta sesión y pestaña. Si recargás o cerrás la pestaña, podés perder el borrador.</p></aside>
    {sandbox && <SubmissionStatus fincaId={farm.id} autoFocus onField={path => { const index = STEPS.findIndex(item => item.fields.some(field => field.path === path)); go(index); requestAnimationFrame(() => focusVisible(document.getElementById(fieldId(path)))); }} />}
    <nav aria-label="Pasos de la simulación"><ol className={s.progress}>{STEPS.map((item, index) => <li key={item.title}><button type="button" disabled={locked || index > draft.reached} aria-current={index === step ? "step" : undefined} aria-label={`Paso ${index + 1} de 5: ${item.title}`} onClick={() => go(index)}><span>{index + 1}</span><span className={s.stepLabel}>{item.title}</span></button></li>)}</ol></nav>
    <section className={`${s.panel} ${s[`category${step}`]}`} aria-labelledby="v2-step-title">
      <p className={s.eyebrow}>Paso {step + 1} de 5</p><h2 id="v2-step-title" tabIndex={-1} ref={title}><Icon aria-hidden="true" /> {current.title}</h2><p>{sandbox && step === 4 ? "Revisá los datos antes de enviar a la API simulada." : current.description}</p>
      <fieldset className={s.editable} disabled={locked} aria-label="Datos de la simulación">
      {step < 4 ? <form onSubmit={continueStep} noValidate>
        <p className={s.hint}>* Datos obligatorios. Coma o punto decimal, sin separadores de miles.</p>
        {submitted && Object.keys(validation.errors).length > 0 && <p role="alert" className={s.error}>Revisá los datos indicados antes de continuar.</p>}
        <div className={s.fields}>{current.fields.map(field => <Field key={field.path} field={field} raw={draft.values[field.path]} resolution={draft.resolutions[field.path]}
          error={submission.fields[field.path] || ((submitted || touched[field.path]) ? validation.errors[field.path] : null)}
          onBlur={() => setTouched(previous => ({ ...previous, [field.path]: true }))}
          onChange={value => update(field.path, value)} onResolve={kind => resolve(field.path, kind)} />)}</div>
        <div className={s.actions}>{step > 0 && <button className={s.secondary} type="button" onClick={() => go(step - 1)}>Atrás</button>}<button className={s.primary} type="submit">Continuar</button></div>
      </form> : <>
        <Field field={current.fields[0]} raw={draft.values.name} onChange={value => update("name", value)} onBlur={() => setTouched(previous => ({ ...previous, name: true }))} error={submission.fields.name || (submitted || touched.name ? validation.errors.name : null)} />
        {!complete.ok && <div className={s.error} id="v2-review-errors" tabIndex={-1} role="alert"><strong>Hay datos pendientes de corrección.</strong><ul>{Object.entries(complete.errors).map(([path, message]) => {
          const index = STEPS.findIndex(item => item.fields.some(field => field.path === path));
          const field = STEPS[index].fields.find(item => item.path === path);
          return <li key={path}><button type="button" onClick={() => { go(index); requestAnimationFrame(() => focusVisible(document.getElementById(fieldId(path)))); }}>{field.label}: {message}</button></li>;
        })}</ul></div>}
        <div className={s.review}>{STEPS.slice(0, 4).map((item, index) => <section key={item.title} className={s[`category${index}`]} aria-labelledby={`v2-review-${index}`}><div className={s.reviewHead}><h3 id={`v2-review-${index}`}>{item.title}</h3><button type="button" className={s.secondary} onClick={() => go(index)} aria-label={`Corregir ${item.title}`}>Corregir</button></div><dl>{item.fields.map(field => <div key={field.path}><dt>{field.label}{field.unit && ` (${field.unit})`}</dt><dd>{reviewValue(field, draft.values[field.path], draft.resolutions[field.path])}</dd></div>)}</dl></section>)}</div>
        <div className={s.actions}><button className={s.secondary} type="button" onClick={() => go(3)}>Atrás</button><button className={s.primary} type="button" onClick={prepare}>Validar preparación</button></div>
        {preparedSignature === signature && complete.ok && <p role="status" className={s.success}>Datos revisados y preparados. No se envió ninguna solicitud ni se guardó una simulación.</p>}
        <div className={s.availability}><button className={s.primary} type="button" disabled={!sandbox || locked} aria-describedby="v2-save-explanation" onClick={() => { setSubmitted(true); if (complete.ok) submit(); else focusVisible(document.getElementById("v2-review-errors")); }}>{submission.status === "pending" ? "Procesando..." : "Calcular y guardar"}</button><p id="v2-save-explanation">{sandbox ? "Solo API simulada. El backend real y la creación pública V2 permanecen bloqueados." : "El guardado está en preparación y permanece deshabilitado. Esta vista no se conecta a la creación de simulaciones."}</p></div>
      </>}
      </fieldset>
    </section>
    <Modal isOpen={blocker.state === "blocked"} onClose={() => blocker.reset()} title="¿Salir de la preparación local?">
      <p>Podés conservar un único borrador en esta pestaña. Recargar, cerrar o terminar la sesión puede perderlo.</p>
      {["pending", "uncertain"].includes(submission.status) && <p>Salir o descartar datos locales no revierte el POST. El guardado puede completarse aunque abandones esta pantalla.</p>}
      <div className={s.dialogActions}><button type="button" className={s.secondary} onClick={() => blocker.reset()}>Cancelar salida</button><button type="button" className={s.primary} onClick={() => leave(false)}>Salir y conservar</button><button type="button" className={s.secondary} disabled={submission.status === "pending"} onClick={() => leave(true)}>Descartar y salir</button></div>
    </Modal>
  </div>;
}

export default function SimulationWizard({ fincaId, sessionToken }) {
  const view = useOwnedFarm(fincaId, sessionToken);
  const { draft, start, submission } = useContext(IrrigationDraftContext);
  const navigate = useNavigate();
  const initialized = useRef(false);
  const hadDraft = useRef(false);
  if (draft?.fincaId === fincaId) hadDraft.current = true;
  useEffect(() => {
    if (view.farm && !draft && submission.status === "confirmed" && submission.attempt.fincaId !== fincaId) {
      start(view.farm);
      return;
    }
    if (view.farm && !initialized.current) {
      initialized.current = true;
      if (!draft) start(view.farm);
    }
  }, [view.farm, draft, start, submission.status]);
  if (view.loading) return <div className={`${farmStyles.detail} container`}><h1>Preparación de simulación</h1><p role="status" className={farmStyles.loading}>Consultando la finca...</p></div>;
  if (view.error) return <div className={`${farmStyles.detail} container`}><h1>No pudimos consultar la finca</h1><p role="alert" className={farmStyles.error}>{view.error.message}</p><button className={farmStyles.secondary} type="button" onClick={view.retry}>Volver a consultar</button><p><Link className={farmStyles.backLink} to="/fincas">Volver a Mis fincas</Link></p></div>;
  if (!view.farm) return <div className={`${farmStyles.detail} container`}><h1>Finca no disponible</h1><p className={farmStyles.loading}>No encontramos esta finca entre las disponibles para tu sesión.</p><Link className={farmStyles.backLink} to="/fincas">Volver a Mis fincas</Link></div>;
  if (hadDraft.current && submission.status === "confirmed" && submission.attempt.fincaId === fincaId) return <Navigate to={`/fincas/${fincaId}/simulaciones/${submission.snapshot.simulation.id}`} replace />;
  if (!draft) return <p className="container" role="status">Preparando el borrador...</p>;
  if (draft.fincaId !== fincaId) return <Modal isOpen title="Ya tenés un borrador de otra finca" onClose={() => navigate(`/fincas/${fincaId}`, { replace: true })}>
    <p>El borrador pertenece a {draft.farmName}. No trasladaremos sus datos a {view.farm.nombre_finca}.</p>
    {["pending", "uncertain"].includes(submission.status) && <p>El envío anterior puede haberse guardado. Descartar datos locales no revierte ese guardado.</p>}
    <div className={s.dialogActions}><button type="button" className={s.primary} onClick={() => navigate(`/fincas/${draft.fincaId}/simulaciones/nueva`, { replace: true })}>Volver al borrador</button><button type="button" className={s.secondary} disabled={submission.status === "pending"} onClick={() => start(view.farm)}>Descartar y comenzar aquí</button><button type="button" className={s.secondary} onClick={() => navigate(`/fincas/${fincaId}`, { replace: true })}>Cancelar</button></div>
  </Modal>;
  return <ActiveWizard farm={view.farm} sessionToken={sessionToken} />;
}
