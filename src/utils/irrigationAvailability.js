// Sandbox histórico H1/H2: solo DEV y un destino exclusivo de API simulada.
// El flujo real tiene un opt-in y una comprobación autenticada independientes.
export const SIMULATION_MOCK_ORIGIN = "https://riegar-v2.invalid";
export const SIMULATION_SANDBOX_NOTICE = "API simulada: los registros de esta vista son de prueba.";
const servedByVite = typeof __RIEGAR_DEV_SERVER__ !== "undefined" && __RIEGAR_DEV_SERVER__ === true;
export const localSimulationPreparation = servedByVite && import.meta.env?.DEV === true && import.meta.env?.PROD !== true;
export const academicDemoAvailable = import.meta.env?.MODE === "staging";
export const ACADEMIC_DEMO_FORM_PATH = "/demo/simulacion-v2";
export const ACADEMIC_DEMO_RESULTS_PATH = "/demo/resultados-v2";
export const ACADEMIC_API_ORIGIN = "https://riegar-api-demo.onrender.com";
export const ACADEMIC_APP_ORIGIN = "https://riegar-academico.netlify.app";

// Opt-in independiente del ejemplo visual y del sandbox. Solo el despliegue académico revisado.
export function isRealSimulationEnvironment(env = import.meta.env, origin = globalThis.location?.origin) {
  return env?.MODE === "staging" && env.PROD === true && env.DEV === false &&
    env.VITE_RIEGAR_REAL_V2 === "true" && env.VITE_RIEGAR_V2_MOCK !== "true" &&
    env.VITE_API_URL === ACADEMIC_API_ORIGIN && origin === ACADEMIC_APP_ORIGIN;
}
export const realSimulationPreparation = isRealSimulationEnvironment();
export const simulationPreparationAvailable = localSimulationPreparation || realSimulationPreparation;

export function isSimulationSandbox(env = import.meta.env, devServer = servedByVite) {
  return devServer === true && env?.DEV === true && env?.PROD !== true &&
    env.VITE_RIEGAR_V2_MOCK === "true" && env.VITE_API_URL === SIMULATION_MOCK_ORIGIN;
}
