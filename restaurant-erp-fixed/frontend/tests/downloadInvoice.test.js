import test from "node:test";
import assert from "node:assert/strict";
import { cleanInvoiceFileName } from "../src/utils/downloadInvoice.js";

test("cleanInvoiceFileName normalizes invoice numbers", () => {
  assert.equal(cleanInvoiceFileName("INV/123 ABC"), "inv-123-abc.html");
});
