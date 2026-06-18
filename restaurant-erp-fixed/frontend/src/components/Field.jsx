// Wraps any input with a label and an inline validation message so every
// form across the app shows errors the same way.
export default function Field({ label, error, hint, children }) {
  return (
    <div className={`field${error ? " invalid" : ""}`}>
      {label && <label>{label}</label>}
      {children}
      {error ? (
        <span className="field-error">{error}</span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </div>
  );
}
