export const cleanInvoiceFileName = (invoiceNumber = "invoice") =>
  `${String(invoiceNumber).replace(/[^a-z0-9_-]/gi, "-").toLowerCase()}.html`;

export function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
