// Catches errors thrown in async route handlers and sends clean JSON.
export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  // Mongoose schema validation (e.g. name with numbers, bad phone) -> 400
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(" ");
    return res.status(400).json({ message: message || "Validation failed." });
  }

  // Bad ObjectId in a URL param -> 400 instead of a confusing 500
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}.` });
  }

  // Duplicate unique key (e.g. email or table number already exists) -> 400
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "value";
    return res.status(400).json({ message: `That ${field} is already in use.` });
  }

  // Fall back to whatever status was set, or 500
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  if (status >= 500) console.error(err.stack);
  res.status(status).json({ message: err.message || "Server error" });
};
