// Preparación H1/H2: solo DEV y un destino exclusivo de API simulada.
// No habilita producción ni selecciona la versión del backend.
export const SIMULATION_MOCK_ORIGIN = "https://riegar-v2.invalid";
export const SIMULATION_SANDBOX_NOTICE = "API simulada: los registros de esta vista son de prueba.";
export function isSimulationSandbox(env = import.meta.env) {
  return env?.DEV === true && env?.PROD !== true &&
    env.VITE_RIEGAR_V2_MOCK === "true" && env.VITE_API_URL === SIMULATION_MOCK_ORIGIN;
}
