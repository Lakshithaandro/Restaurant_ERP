// Mirrors backend/utils/validators.js so the form shows the same errors the
// API would return, but instantly as the user types.

const NAME_REGEX = /^[\p{L}][\p{L}\s.'-]*$/u;
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Keep only digits — used to restrict phone inputs to numbers as they type.
export const onlyDigits = (value = "") => String(value).replace(/\D/g, "");

// Each returns an error string, or "" when valid.
export const nameError = (value, label = "Name") => {
  const v = String(value || "").trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > 60) return `${label} must be under 60 characters.`;
  if (/\d/.test(v)) return `${label} cannot contain numbers.`;
  if (!NAME_REGEX.test(v))
    return `${label} can only use letters, spaces, hyphens and apostrophes.`;
  return "";
};

export const phoneError = (value, { required = false, label = "Phone" } = {}) => {
  const v = onlyDigits(value);
  if (!v) return required ? `${label} is required.` : "";
  if (!PHONE_REGEX.test(v)) return `${label} must be exactly 10 digits.`;
  return "";
};

export const emailError = (value, label = "Email") => {
  const v = String(value || "").trim();
  if (!v) return `${label} is required.`;
  if (!EMAIL_REGEX.test(v)) return `Enter a valid ${label.toLowerCase()}.`;
  return "";
};

export const requiredError = (value, label = "This field") =>
  String(value || "").trim() ? "" : `${label} is required.`;

export const passwordError = (value, label = "Password") => {
  const v = String(value || "");
  if (!v) return `${label} is required.`;
  if (v.length < 6) return `${label} must be at least 6 characters.`;
  return "";
};

// True only when every value in the errors object is empty.
export const isClean = (errors) => Object.values(errors).every((e) => !e);
