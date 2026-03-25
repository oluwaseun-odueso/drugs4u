import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { customers as api } from "../lib/api";
import CustomerModal from "../components/CustomerModal";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get(id)
      .then(setCustomer)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  if (!customer)
    return (
      <div className="empty-state">
        <p>Customer not found.</p>
      </div>
    );

  const c = customer;

  return (
    <>
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/customers")}
            style={{ marginBottom: 8 }}
          >
            ← Back
          </button>
          <h1>
            {c.title} {c.first_name} {c.last_name}
          </h1>
          <p>
            NHS: {c.nhs_number || "N/A"} &middot; Age: {c.age}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>

      <div className="two-cols" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <h2>Personal Information</h2>
          </div>
          <div className="card-body">
            {[
              ["Date of Birth", c.date_of_birth],
              ["Phone", c.phone],
              ["Email", c.email || "—"],
              [
                "Address",
                [c.address_line1, c.address_line2, c.city, c.postcode]
                  .filter(Boolean)
                  .join(", "),
              ],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                  }}
                >
                  {label}
                </div>
                <div style={{ marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Medical Information</h2>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: ".5px",
                  marginBottom: 4,
                }}
              >
                Allergies
              </div>
              {c.allergies ? (
                <div className="alert alert-warning" style={{ margin: 0 }}>
                  ⚠ {c.allergies}
                </div>
              ) : (
                <span className="text-muted">None recorded</span>
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: ".5px",
                  marginBottom: 4,
                }}
              >
                Medical Conditions
              </div>
              <div>
                {c.medical_conditions || (
                  <span className="text-muted">None recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Medication History</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Medicine</th>
                <th>Strength</th>
                <th>Form</th>
                <th>Qty</th>
                <th>Dosage Instructions</th>
                <th>Prescribed By</th>
              </tr>
            </thead>
            <tbody>
              {c.medication_history.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="icon">💊</div>
                      <p>No medication history</p>
                    </div>
                  </td>
                </tr>
              )}
              {c.medication_history.map((h, i) => (
                <tr key={i}>
                  <td>{h.prescription_date}</td>
                  <td>
                    <strong>{h.medication_name}</strong>
                  </td>
                  <td>{h.strength}</td>
                  <td>{h.form}</td>
                  <td>{h.quantity_dispensed}</td>
                  <td>{h.dosage_instructions || "—"}</td>
                  <td>{h.prescribed_by || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <CustomerModal
          initial={c}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </>
  );
}
