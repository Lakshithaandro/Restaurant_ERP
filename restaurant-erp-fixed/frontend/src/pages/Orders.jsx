import { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { requiredError, isClean } from "../utils/validation.js";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const CATEGORIES = ["Starters", "Main Course", "Desserts", "Beverages", "Sides"];
const emptyMenuItem = {
  name: "",
  category: "Main Course",
  price: 0,
  description: "",
  available: true,
  recipe: [],
};

export default function Orders() {
  const { user } = useAuth();
  const canManageMenu = ["admin", "manager"].includes(user.role);

  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableId, setTableId] = useState("");
  const [flash, setFlash] = useState({ type: "", message: "" });
  const [placing, setPlacing] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [showMenu, setShowMenu] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuForm, setMenuForm] = useState(emptyMenuItem);
  const [touched, setTouched] = useState({});

  const load = () => {
    api.get("/orders/menu").then((r) => setMenu(r.data));
    api.get("/reservations/tables").then((r) => setTables(r.data));
    api.get("/orders").then((r) => setOrders(r.data));
    api.get("/inventory").then((r) => setInventory(r.data)).catch(() => {});
  };
  useEffect(load, []);

  const note = (type, message, ms = 2500) => {
    setFlash({ type, message });
    setTimeout(() => setFlash({ type: "", message: "" }), ms);
  };

  const unitOf = (id) => inventory.find((i) => i._id === id)?.unit || "";
  const menuCategories = useMemo(
    () => ["All", ...Array.from(new Set(menu.filter((m) => m.available).map((m) => m.category || "Other")))],
    [menu]
  );
  const orderableMenu = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    return menu.filter((m) => {
      if (!m.available) return false;
      if (activeCategory !== "All" && (m.category || "Other") !== activeCategory) return false;
      if (!q) return true;
      return `${m.name} ${m.category} ${m.description || ""}`.toLowerCase().includes(q);
    });
  }, [menu, activeCategory, menuQuery]);

  const addToCart = (item) => {
    setCart((c) => {
      const found = c.find((x) => x.menuItem === item._id);
      if (found)
        return c.map((x) =>
          x.menuItem === item._id ? { ...x, quantity: x.quantity + 1 } : x
        );
      return [...c, { menuItem: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((c) =>
      c
        .map((x) => (x.menuItem === id ? { ...x, quantity: x.quantity + delta } : x))
        .filter((x) => x.quantity > 0)
    );
  };

  const total = cart.reduce((s, x) => s + x.price * x.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      await api.post("/orders", {
        tableId: tableId || undefined,
        items: cart.map((x) => ({ menuItem: x.menuItem, quantity: x.quantity })),
      });
      setCart([]);
      setTableId("");
      note("ok", "Order sent to the kitchen.");
      load();
    } catch (err) {
      note("err", err.response?.data?.message || "Could not place order.");
    } finally {
      setPlacing(false);
    }
  };

  // ---- menu management ----
  const menuErrors = { name: requiredError(menuForm.name, "Dish name") };

  const openNewMenu = () => {
    setEditingMenu(null);
    setMenuForm(emptyMenuItem);
    setTouched({});
    setShowMenu(true);
  };
  const openEditMenu = (m) => {
    setEditingMenu(m._id);
    setMenuForm({
      name: m.name,
      category: m.category,
      price: m.price,
      description: m.description || "",
      available: m.available,
      recipe: (m.recipe || []).map((r) => ({
        item: r.item?._id || r.item || "",
        quantity: r.quantity,
      })),
    });
    setTouched({});
    setShowMenu(true);
  };

  // recipe row helpers
  const addIngredient = () =>
    setMenuForm((f) => ({ ...f, recipe: [...f.recipe, { item: "", quantity: 0.1 }] }));
  const setIngredient = (idx, key, value) =>
    setMenuForm((f) => ({
      ...f,
      recipe: f.recipe.map((row, i) => (i === idx ? { ...row, [key]: value } : row)),
    }));
  const removeIngredient = (idx) =>
    setMenuForm((f) => ({ ...f, recipe: f.recipe.filter((_, i) => i !== idx) }));

  const saveMenu = async () => {
    setTouched({ name: true });
    if (!isClean(menuErrors)) return;
    const payload = {
      ...menuForm,
      price: Math.max(0, +menuForm.price || 0),
      recipe: menuForm.recipe
        .filter((r) => r.item && Number(r.quantity) > 0)
        .map((r) => ({ item: r.item, quantity: Number(r.quantity) })),
    };
    try {
      if (editingMenu) await api.put(`/orders/menu/${editingMenu}`, payload);
      else await api.post("/orders/menu", payload);
      load();
      note("ok", editingMenu ? "Menu item updated." : "Menu item added.");
      if (!editingMenu) {
        setMenuForm(emptyMenuItem);
        setTouched({});
      } else {
        setShowMenu(false);
      }
    } catch (err) {
      note("err", err.response?.data?.message || "Could not save menu item.");
    }
  };

  const toggleAvailable = async (m) => {
    await api.put(`/orders/menu/${m._id}`, { available: !m.available });
    load();
  };

  const removeMenu = async (m) => {
    if (!window.confirm(`Delete ${m.name} from the menu?`)) return;
    await api.delete(`/orders/menu/${m._id}`);
    load();
    note("ok", `${m.name} removed.`);
  };

  return (
    <>
      {flash.message && <div className={`flash ${flash.type}`}>{flash.message}</div>}

      <div className="grid" style={{ gridTemplateColumns: "1.7fr 1fr", alignItems: "start" }}>
        <div>
          <div className="section-head menu-section-head">
            <div>
              <h3 className="section-title">Menu catalogue</h3>
              <p className="section-sub">E-commerce style menu browsing for faster order entry.</p>
            </div>
            {canManageMenu && (
              <button className="btn btn-ghost btn-sm" onClick={openNewMenu}>
                Manage menu
              </button>
            )}
          </div>
          <div className="menu-toolbar card">
            <input
              className="input menu-search"
              placeholder="Search dishes, categories, descriptions…"
              value={menuQuery}
              onChange={(e) => setMenuQuery(e.target.value)}
            />
            <div className="category-pills">
              {menuCategories.map((cat) => (
                <button
                  key={cat}
                  className={`pill-btn ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                  type="button"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {orderableMenu.length === 0 ? (
            <div className="card card-pad empty">No matching dishes. Clear the search or add items from “Manage menu”.</div>
          ) : (
            <div className="menu-grid">
              {orderableMenu.map((m) => (
                <button key={m._id} type="button" className="menu-tile" onClick={() => addToCart(m)}>
                  <div className="menu-cat">{m.category}</div>
                  <div className="menu-name">{m.name}</div>
                  {m.description && <p>{m.description}</p>}
                  <div className="menu-tile-foot">
                    <span className="menu-price">{inr(m.price)}</span>
                    <span className="tile-add">+</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card card-pad cart">
            <h3 className="section-title" style={{ marginBottom: 14 }}>
              Current order
            </h3>
            <Field label="Table">
              <select
                className="input"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
              >
                <option value="">Takeaway / no table</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    Table {t.number}
                  </option>
                ))}
              </select>
            </Field>

            {cart.length === 0 ? (
              <div className="empty" style={{ padding: "30px 10px" }}>
                Tap menu items to add them.
              </div>
            ) : (
              <>
                {cart.map((x) => (
                  <div key={x.menuItem} className="cart-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>{x.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {inr(x.price)}
                      </div>
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => changeQty(x.menuItem, -1)}>
                        –
                      </button>
                      <span>{x.quantity}</span>
                      <button className="qty-btn" onClick={() => changeQty(x.menuItem, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 16,
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  <span>Total</span>
                  <span>{inr(total)}</span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
                  onClick={placeOrder}
                  disabled={placing}
                >
                  {placing ? "Sending…" : "Place order"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h3 className="section-title">Recent orders</h3>
        </div>
        <div className="card table-wrap">
          {orders.length === 0 ? (
            <div className="empty">No orders yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Table</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 15).map((o) => (
                  <tr key={o._id}>
                    <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                    <td>{o.tableNumber ? `Table ${o.tableNumber}` : "Takeaway"}</td>
                    <td>{o.items.reduce((s, i) => s + i.quantity, 0)} items</td>
                    <td>{inr(o.total)}</td>
                    <td>
                      <span className={`badge ${o.status}`}>{o.status}</span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>
                      {new Date(o.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showMenu && (
        <Modal
          title="Manage menu"
          onClose={() => setShowMenu(false)}
          footer={
            <button className="btn btn-ghost" onClick={() => setShowMenu(false)}>
              Done
            </button>
          }
        >
          <div className="menu-editor">
            <div className="row">
              <Field label="Dish name" error={touched.name ? menuErrors.name : ""}>
                <input
                  className="input"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  onBlur={() => setTouched({ name: true })}
                  placeholder="Paneer Tikka"
                />
              </Field>
              <Field label="Price (₹)">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={menuForm.price}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, price: Math.max(0, +e.target.value || 0) })
                  }
                />
              </Field>
            </div>
            <Field label="Category">
              <select
                className="input"
                value={menuForm.category}
                onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <input
                className="input"
                value={menuForm.description}
                onChange={(e) =>
                  setMenuForm({ ...menuForm, description: e.target.value })
                }
                placeholder="Short description"
              />
            </Field>

            {/* Recipe / ingredients: deducted from inventory per serving when served */}
            <div className="recipe-block">
              <div className="recipe-head">
                <span>Ingredients used per serving</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addIngredient}>
                  + Add ingredient
                </button>
              </div>
              {menuForm.recipe.length === 0 ? (
                <div className="recipe-empty">
                  No ingredients yet. Add them so stock is reduced automatically when this dish is served.
                </div>
              ) : (
                menuForm.recipe.map((row, idx) => (
                  <div key={idx} className="recipe-row">
                    <select
                      className="input"
                      value={row.item}
                      onChange={(e) => setIngredient(idx, "item", e.target.value)}
                    >
                      <option value="">Select ingredient…</option>
                      {inventory.map((inv) => (
                        <option key={inv._id} value={inv._id}>
                          {inv.name} ({inv.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      className="input recipe-qty"
                      type="number"
                      min="0"
                      step="0.001"
                      value={row.quantity}
                      onChange={(e) => setIngredient(idx, "quantity", e.target.value)}
                    />
                    <span className="recipe-unit">{unitOf(row.item)}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => removeIngredient(idx)}
                      aria-label="Remove ingredient"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={saveMenu}
              disabled={!isClean(menuErrors)}
              style={{ marginTop: 6 }}
            >
              {editingMenu ? "Update item" : "Add to menu"}
            </button>
            {editingMenu && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setEditingMenu(null);
                  setMenuForm(emptyMenuItem);
                  setTouched({});
                }}
              >
                New item
              </button>
            )}
          </div>

          <div className="menu-list">
            {menu.map((m) => (
              <div key={m._id} className="menu-list-row">
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {m.name}{" "}
                    {!m.available && <span className="badge cancelled">hidden</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {m.category} · {inr(m.price)} ·{" "}
                    {m.recipe?.length
                      ? `${m.recipe.length} ingredient${m.recipe.length > 1 ? "s" : ""}`
                      : "no recipe"}
                  </div>
                </div>
                <div style={{ whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleAvailable(m)}>
                    {m.available ? "Hide" : "Show"}
                  </button>{" "}
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditMenu(m)}>
                    Edit
                  </button>{" "}
                  <button className="btn btn-ghost btn-sm danger" onClick={() => removeMenu(m)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
