import MenuItem from "../models/MenuItem.js";
import InventoryItem from "../models/InventoryItem.js";

// Pull each dish's recipe ingredients out of inventory when an order is served.
// Called from both the kitchen status flow and billing. Safe to call more than
// once: the order's `inventoryDeducted` flag means stock is only reduced once.
//
// Returns a short list of what was deducted (handy for logs / sockets).
export const deductInventoryForOrder = async (order) => {
  if (!order || order.inventoryDeducted) return [];

  // Total required quantity per inventory ingredient across all order lines.
  // Map key = inventory item id, value = total quantity to remove.
  const required = new Map();

  for (const line of order.items || []) {
    if (!line.menuItem) continue;
    const dish = await MenuItem.findById(line.menuItem).select("recipe name");
    if (!dish || !dish.recipe?.length) continue;
    const servings = Number(line.quantity) || 0;
    for (const ing of dish.recipe) {
      if (!ing.item) continue;
      const key = String(ing.item);
      const amount = (Number(ing.quantity) || 0) * servings;
      required.set(key, (required.get(key) || 0) + amount);
    }
  }

  const deducted = [];
  for (const [itemId, amount] of required.entries()) {
    if (amount <= 0) continue;
    const inv = await InventoryItem.findById(itemId);
    if (!inv) continue; // ingredient was removed; skip gracefully
    const before = inv.quantity;
    // Never let stock go negative even if we serve more than we have on hand.
    inv.quantity = Math.max(0, +(before - amount).toFixed(3));
    await inv.save();
    deducted.push({ name: inv.name, used: amount, remaining: inv.quantity });
  }

  order.inventoryDeducted = true;
  await order.save();
  return deducted;
};
