// Shared validation helpers used by both Mongoose schemas and controllers.
// Keeping the rules in one place means the API and the database agree on
// exactly what "valid" means, so bad data can never sneak in from any route.

// A person's name: must start with a letter and may only contain letters,
// spaces, apostrophes, hyphens and periods. Digits and other symbols are not
// allowed. Supports accented/Unicode letters for international names.
export const NAME_REGEX = /^[\p{L}][\p{L}\s.'-]*$/u;

// Exactly ten digits, after stripping spaces and hyphens that people often type.
export const normalizePhone = (value = "") => String(value).replace(/[\s-]/g, "");
export const PHONE_REGEX = /^\d{10}$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns an error message string, or null when the value is valid.
export const nameError = (value, label = "Name") => {
  const v = String(value || "").trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > 60) return `${label} must be under 60 characters.`;
  if (/\d/.test(v)) return `${label} cannot contain numbers.`;
  if (!NAME_REGEX.test(v))
    return `${label} can only contain letters, spaces, hyphens and apostrophes.`;
  return null;
};

// Phone is optional by default; pass { required: true } to force it.
export const phoneError = (value, { required = false, label = "Phone" } = {}) => {
  const v = normalizePhone(value);
  if (!v) return required ? `${label} is required.` : null;
  if (!PHONE_REGEX.test(v)) return `${label} must be exactly 10 digits.`;
  return null;
};

export const emailError = (value, label = "Email") => {
  const v = String(value || "").trim();
  if (!v) return `${label} is required.`;
  if (!EMAIL_REGEX.test(v)) return `Enter a valid ${label.toLowerCase()}.`;
  return null;
};

// Mongoose validator wrappers (return boolean) so we can attach them to schemas.
export const isValidName = (value) => nameError(value) === null;
export const isOptionalPhone = (value) =>
  phoneError(value, { required: false }) === null;
