import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  nameError,
  phoneError,
  emailError,
  requiredError,
  onlyDigits,
  isClean,
} from "../utils/validation.js";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const num = (v) => Math.max(0, Number.isFinite(+v) ? +v : 0);

const emptyItem = {
  name: "",
  unit: "kg",
  quantity: 0,
  lowStockThreshold: 10,
  costPerUnit: 0,
  supplier: "",
};
const emptySupplier = { name: "", contactPerson: "", phone: "", email: "", address: "" };

export default function Inventory() {
  const { user } = useAuth();
  const canEdit = ["admin", "manager"].includes(user.role);

  const [tab, setTab] = useState("stock");
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [flash, setFlash] = useState({ type: "", message: "" });

  const [showItem, setShowItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItem);

  const [showSupplier, setShowSupplier] = useState(false);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [touched, setTouched] = useState({});

  const load = () => {
    api.get("/inventory").then((r) => setItems(r.data));
    api.get("/inventory/suppliers/all").then((r) => setSuppliers(r.data));
  };
  useEffect(load, []);

  const note = (type, message, ms = 3000) => {
    setFlash({ type, message });
    setTimeout(() => setFlash({ type: "", message: "" }), ms);
  };
  const blur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  // ---- inventory items ----
  const itemErrors = { name: requiredError(itemForm.name, "Item name") };

  const openNewItem = () => {
    setEditingItem(null);
    setItemForm(emptyItem);
    setTouched({});
    setShowItem(true);
  };
  const openEditItem = (it) => {
    setEditingItem(it._id);
    setItemForm({
      name: it.name,
      unit: it.unit,
      quantity: it.quantity,
      lowStockThreshold: it.lowStockThreshold,
      costPerUnit: it.costPerUnit,
      supplier: it.supplier?._id || "",
    });
    setTouched({});
    setShowItem(true);
  };

  const saveItem = async () => {
    setTouched((t) => ({ ...t, name: true }));
    if (!isClean(itemErrors)) return;
    const payload = {
      ...itemForm,
      quantity: num(itemForm.quantity),
      lowStockThreshold: num(itemForm.lowStockThreshold),
      costPerUnit: num(itemForm.costPerUnit),
      supplier: itemForm.supplier || undefined,
    };
    try {
      if (editingItem) await api.put(`/inventory/${editingItem}`, payload);
      else await api.post("/inventory", payload);
      setShowItem(false);
      load();
      note("ok", editingItem ? "Item updated." : "Item added.");
    } catch (err) {
      note("err", err.response?.data?.message || "Could not save item.");
    }
  };

  const removeItem = async (it) => {
    if (!window.confirm(`Delete ${it.name}?`)) return;
    await api.delete(`/inventory/${it._id}`);
    load();
    note("ok", `${it.name} deleted.`);
  };

  // ---- suppliers ----
  const supplierErrors = {
    name: requiredError(supplierForm.name, "Supplier name"),
    contactPerson: supplierForm.contactPerson
      ? nameError(supplierForm.contactPerson, "Contact person")
      : "",
    phone: phoneError(supplierForm.phone, { required: false }),
    email: supplierForm.email ? emailError(supplierForm.email) : "",
  };

  const openNewSupplier = () => {
    setSupplierForm(emptySupplier);
    setTouched({});
    setShowSupplier(true);
  };

  const saveSupplier = async () => {
    setTouched({ sname: true, contactPerson: true, phone: true, email: true });
    if (!isClean(supplierErrors)) return;
    try {
      await api.post("/inventory/suppliers", supplierForm);
      setShowSupplier(false);
      load();
      note("ok", "Supplier added.");
    } catch (err) {
      note("err", err.response?.data?.message || "Could not add supplier.");
    }
  };

  const removeSupplier = async (s) => {
    if (!window.confirm(`Remove ${s.name}?`)) return;
    try {
      await api.delete(`/inventory/suppliers/${s._id}`);
      load();
      note("ok", `${s.name} removed.`);
    } catch (err) {
      note("err", err.response?.data?.message || "Could not remove supplier.");
    }
  };

  return (
    <>
      {flash.message && <div className={`flash ${flash.type}`}>{flash.message}</div>}

      <div className="tabs">
        <button
          className={`tab ${tab === "stock" ? "active" : ""}`}
          onClick={() => setTab("stock")}
        >
          Stock levels
        </button>
        <button
          className={`tab ${tab === "suppliers" ? "active" : ""}`}
          onClick={() => setTab("suppliers")}
        >
          Suppliers
        </button>
      </div>

      {tab === "stock" && (
        <>
          <div className="section-head">
            <h3 className="section-title">Stock levels</h3>
            {canEdit && (
              <button className="btn btn-primary" onClick={openNewItem}>
                + Add item
              </button>
            )}
          </div>
          <div className="card table-wrap">
            {items.length === 0 ? (
              <div className="empty">No inventory items yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>In stock</th>
                    <th>Threshold</th>
                    <th>Cost / unit</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    {canEdit && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const low = it.quantity <= it.lowStockThreshold;
                    return (
                      <tr key={it._id}>
                        <td style={{ fontWeight: 600 }}>{it.name}</td>
                        <td>
                          {it.quantity} {it.unit}
                        </td>
                        <td style={{ color: "var(--muted)" }}>
                          {it.lowStockThreshold} {it.unit}
                        </td>
                        <td>{inr(it.costPerUnit)}</td>
                        <td>{it.supplier?.name || "—"}</td>
                        <td>
                          <span className={`badge ${low ? "cancelled" : "available"}`}>
                            {low ? "Low stock" : "OK"}
                          </span>
                        </td>
                        {canEdit && (
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => openEditItem(it)}
                            >
                              Edit
                            </button>{" "}
                            <button
                              className="btn btn-ghost btn-sm danger"
                              onClick={() => removeItem(it)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === "suppliers" && (
        <>
          <div className="section-head">
            <h3 className="section-title">Suppliers</h3>
            {canEdit && (
              <button className="btn btn-primary" onClick={openNewSupplier}>
                + Add supplier
              </button>
            )}
          </div>
          <div className="card table-wrap">
            {suppliers.length === 0 ? (
              <div className="empty">No suppliers yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Contact</th>
                    <th>Phone</th>
                    <th>Email</th>
                    {canEdit && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.contactPerson || "—"}</td>
                      <td>{s.phone || "—"}</td>
                      <td style={{ color: "var(--muted)" }}>{s.email || "—"}</td>
                      {canEdit && (
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-ghost btn-sm danger"
                            onClick={() => removeSupplier(s)}
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {showItem && (
        <Modal
          title={editingItem ? "Edit item" : "Add inventory item"}
          onClose={() => setShowItem(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowItem(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveItem}
                disabled={!isClean(itemErrors)}
              >
                Save
              </button>
            </>
          }
        >
          <Field label="Item name" error={touched.name ? itemErrors.name : ""}>
            <input
              className="input"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              onBlur={() => blur("name")}
            />
          </Field>
          <div className="row">
            <Field label="Quantity">
              <input
                className="input"
                type="number"
                min="0"
                value={itemForm.quantity}
                onChange={(e) =>
                  setItemForm({ ...itemForm, quantity: num(e.target.value) })
                }
              />
            </Field>
            <Field label="Unit">
              <select
                className="input"
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
              >
                <option>kg</option>
                <option>litre</option>
                <option>pieces</option>
                <option>packs</option>
              </select>
            </Field>
          </div>
          <div className="row">
            <Field label="Low-stock threshold">
              <input
                className="input"
                type="number"
                min="0"
                value={itemForm.lowStockThreshold}
                onChange={(e) =>
                  setItemForm({ ...itemForm, lowStockThreshold: num(e.target.value) })
                }
              />
            </Field>
            <Field label="Cost per unit (₹)">
              <input
                className="input"
                type="number"
                min="0"
                value={itemForm.costPerUnit}
                onChange={(e) =>
                  setItemForm({ ...itemForm, costPerUnit: num(e.target.value) })
                }
              />
            </Field>
          </div>
          <Field label="Supplier">
            <select
              className="input"
              value={itemForm.supplier}
              onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
            >
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </Modal>
      )}

      {showSupplier && (
        <Modal
          title="Add supplier"
          onClose={() => setShowSupplier(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowSupplier(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveSupplier}
                disabled={!isClean(supplierErrors)}
              >
                Add
              </button>
            </>
          }
        >
          <Field label="Supplier name" error={touched.sname ? supplierErrors.name : ""}>
            <input
              className="input"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              onBlur={() => blur("sname")}
              placeholder="FreshFarm Produce"
            />
          </Field>
          <Field
            label="Contact person"
            error={touched.contactPerson ? supplierErrors.contactPerson : ""}
          >
            <input
              className="input"
              value={supplierForm.contactPerson}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, contactPerson: e.target.value })
              }
              onBlur={() => blur("contactPerson")}
              placeholder="Ravi Kumar"
            />
          </Field>
          <div className="row">
            <Field
              label="Phone"
              error={touched.phone ? supplierErrors.phone : ""}
              hint="10 digits (optional)"
            >
              <input
                className="input"
                inputMode="numeric"
                value={supplierForm.phone}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    phone: onlyDigits(e.target.value).slice(0, 10),
                  })
                }
                onBlur={() => blur("phone")}
                placeholder="9876543210"
              />
            </Field>
            <Field label="Email" error={touched.email ? supplierErrors.email : ""}>
              <input
                className="input"
                type="email"
                value={supplierForm.email}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, email: e.target.value })
                }
                onBlur={() => blur("email")}
                placeholder="orders@supplier.com"
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              className="input"
              value={supplierForm.address}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, address: e.target.value })
              }
            />
          </Field>
        </Modal>
      )}
    </>
  );
}
