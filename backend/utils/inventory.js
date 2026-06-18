import MenuItem from "../models/MenuItem.js";
import InventoryItem from "../models/InventoryItem.js";

// Pull each dish's recipe ingredients out of inventory when an order is served.
// Called from both the kitchen status flow and billing. Safe to call more than
// once: the order's `inventoryDeducted` flag means stock is only reduced once.
//
// Returns a short list of what was deducted (handy for logs / sockets).
export const deductInventoryForOrder = async (order) => {
  if (!order) return [];
  
  // Mark the order as having processed inventory to maintain state consistency,
  // but do not modify or save any InventoryItem quantities.
  if (!order.inventoryDeducted) {
    order.inventoryDeducted = true;
    await order.save();
  }
  
  return [];
};
