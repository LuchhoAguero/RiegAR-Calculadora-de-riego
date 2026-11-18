import fixtures from "../fixtures/irrigation-v2-results.json" with { type: "json" };
import { FIELDS } from "./irrigationV2Form.js";

export const academicReference = fixtures.find(fixture => fixture.id === "golden");

export function createAcademicDemoDraft() {
  const values = Object.fromEntries(FIELDS.map(field => {
    const value = field.path === "name" ? academicReference.snapshot.simulation.name
      : field.path.split(".").reduce((current, key) => current?.[key], academicReference.snapshot.input);
    return [field.path, value == null ? "" : String(value)];
  }));
  return {
    fincaId: "demo", farmName: "Escenario de demostración GV2-01", values,
    initialValues: { ...values }, resolutions: {}, step: 0, reached: 0,
  };
}
