import { useEffect, useState } from "react";
import api from "../api/axios.js";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/reports")
      .then((r) => setData(r.data))
      .catch(() => setError("Could not load reports. Please refresh."));
  }, []);

  if (error) return <div className="flash err">{error}</div>;

  if (!data)
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );

  const max = Math.max(...data.salesByDay.map((d) => d.revenue), 1);

  return (
    <>
      <div className="grid cards-3">
        <Stat label="Total revenue" value={inr(data.totalRevenue)} />
        <Stat label="Total orders" value={data.totalOrders} />
        <Stat label="Team size" value={data.staffCount} />
      </div>

      <div className="card card-pad section">
        <div className="section-head">
          <h3 className="section-title">Revenue — last 7 days</h3>
        </div>
        <div className="bars">
          {data.salesByDay.map((d) => (
            <div key={d.date} className="bar-col">
              <span className="bar-val">{d.revenue ? inr(d.revenue) : ""}</span>
              <div
                className="bar"
                style={{ height: `${(d.revenue / max) * 100}%` }}
                title={`${d.date}: ${inr(d.revenue)}`}
              />
              <span className="bar-label">{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-pad section">
        <div className="section-head">
          <h3 className="section-title">Daily breakdown</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders billed</th>
              <th style={{ textAlign: "right" }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.salesByDay.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{d.orders}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>
                  {inr(d.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
