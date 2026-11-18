// Preparación H1/H2: solo DEV y un destino exclusivo de API simulada.
// No habilita producción ni selecciona la versión del backend.
export const SIMULATION_MOCK_ORIGIN = "https://riegar-v2.invalid";
export const SIMULATION_SANDBOX_NOTICE = "API simulada: los registros de esta vista son de prueba.";
const servedByVite = typeof __RIEGAR_DEV_SERVER__ !== "undefined" && __RIEGAR_DEV_SERVER__ === true;
export const localSimulationPreparation = servedByVite && import.meta.env?.DEV === true && import.meta.env?.PROD !== true;
export const academicDemoAvailable = import.meta.env?.MODE === "staging";
export const ACADEMIC_DEMO_FORM_PATH = "/demo/simulacion-v2";
export const ACADEMIC_DEMO_RESULTS_PATH = "/demo/resultados-v2";

export function isSimulationSandbox(env = import.meta.env, devServer = servedByVite) {
  return devServer === true && env?.DEV === true && env?.PROD !== true &&
    env.VITE_RIEGAR_V2_MOCK === "true" && env.VITE_API_URL === SIMULATION_MOCK_ORIGIN;
}
