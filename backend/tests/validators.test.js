import test from "node:test";
import assert from "node:assert/strict";
import {
  nameError,
  phoneError,
  emailError,
  normalizePhone,
} from "../utils/validators.js";

test("nameError rejects names containing numbers", () => {
  assert.ok(nameError("John2"));
  assert.ok(nameError("123"));
  assert.match(nameError("John2"), /number/i);
});

test("nameError rejects empty and too-short names", () => {
  assert.ok(nameError(""));
  assert.ok(nameError("A"));
});

test("nameError accepts clean names with spaces, hyphens and apostrophes", () => {
  assert.equal(nameError("Neha Sharma"), null);
  assert.equal(nameError("Jean-Luc"), null);
  assert.equal(nameError("O'Brien"), null);
});

test("phoneError enforces exactly ten digits", () => {
  assert.ok(phoneError("12345", { required: true }));
  assert.ok(phoneError("12345678901", { required: true }));
  assert.ok(phoneError("98765abcde", { required: true }));
  assert.equal(phoneError("9876543210", { required: true }), null);
});

test("phoneError is optional unless required", () => {
  assert.equal(phoneError("", { required: false }), null);
  assert.ok(phoneError("", { required: true }));
});

test("normalizePhone strips spaces and hyphens", () => {
  assert.equal(normalizePhone("98765 43210"), "9876543210");
  assert.equal(normalizePhone("98765-43210"), "9876543210");
});

test("emailError validates basic email shape", () => {
  assert.ok(emailError("not-an-email"));
  assert.equal(emailError("staff@restaurant.com"), null);
});
