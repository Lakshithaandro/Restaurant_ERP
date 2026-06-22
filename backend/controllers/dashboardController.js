import Order from "../models/Order.js";
import Invoice from "../models/Invoice.js";
import Reservation from "../models/Reservation.js";
import InventoryItem from "../models/InventoryItem.js";
import User from "../models/User.js";

const DEBUG_API = process.env.DEBUG_API === "true";

const todayWindow = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

// GET /api/dashboard - summary cards for the home screen
export const getDashboard = async (req, res) => {
  const { start, end } = todayWindow();
  const todayFilter = { createdAt: { $gte: start, $lt: end } };

  const [todaysInvoices, activeReservations, lowStockItems, orders] =
    await Promise.all([
      Invoice.find({ ...todayFilter, paid: true }),
      Reservation.countDocuments({
        status: { $in: ["pending", "confirmed", "seated"] },
      }),
      InventoryItem.find(),
      Order.find(todayFilter),
    ]);

  const todaysRevenue = todaysInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const lowStock = lowStockItems.filter(
    (i) => i.quantity <= i.lowStockThreshold
  );

  // popular items today, computed from order line items
  const counts = {};
  orders.forEach((o) =>
    o.items.forEach((it) => {
      counts[it.name] = (counts[it.name] || 0) + it.quantity;
    })
  );
  const popularItems = Object.entries(counts)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const payload = {
    todaysRevenue,
    ordersToday: orders.length,
    activeReservations,
    lowStockCount: lowStock.length,
    lowStockItems: lowStock.map((i) => ({ name: i.name, quantity: i.quantity })),
    popularItems,
  };

  if (DEBUG_API) {
    console.log("[dashboard] summary", {
      userId: req.user?._id?.toString(),
      todayWindow: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      paidInvoicesToday: todaysInvoices.length,
      ordersToday: orders.length,
      activeReservations,
      inventoryItems: lowStockItems.length,
      lowStockCount: lowStock.length,
      popularItems: popularItems.length,
      payload,
    });
  }

  res.json(payload);
};

// GET /api/dashboard/reports - data for the reports screen
export const getReports = async (req, res) => {
  // sales for the last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const invoices = await Invoice.find({
      createdAt: { $gte: start, $lt: end },
      paid: true,
    });
    days.push({
      date: start.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      revenue: invoices.reduce((s, inv) => s + inv.total, 0),
      orders: invoices.length,
    });
  }

  const [totalRevenueAgg, totalOrders, staffCount] = await Promise.all([
    Invoice.aggregate([
      { $match: { paid: true } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments(),
    User.countDocuments(),
  ]);

  res.json({
    salesByDay: days,
    totalRevenue: totalRevenueAgg[0]?.total || 0,
    totalOrders,
    staffCount,
  });
};
