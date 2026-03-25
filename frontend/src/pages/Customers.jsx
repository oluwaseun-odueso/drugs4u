import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { customers as api } from "../lib/api";
import CustomerModal from "../components/CustomerModal";

export default function Customers() {
  const navigate = useNavigate();
  const [data, setData] = useState({ data: [], total: 0, total_pages: 1 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [modal, setModal] = useState(null); // null | 'add' | customer object

  const load = useCallback(() => {
    setLoading(true);
    setListError("");
    api
      .list({ search, page })
      .then(setData)
      .catch((err) => setListError(err.message))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleSaved = () => {
    setModal(null);
    load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>{data.total} registered customers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("add")}>
          + Add Customer
        </button>
      </div>

      {listError && (
        <div className="alert alert-danger">
          Customers API error: <strong>{listError}</strong>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search by name, phone, email or NHS number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
            {search && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-screen" style={{ minHeight: 200 }}>
              <div className="spinner" />
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Date of Birth</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>NHS No.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="icon">👥</div>
                        <p>No customers found</p>
                      </div>
                    </td>
                  </tr>
                )}
                {data.data.map((c) => (
                  <tr key={c.customer_id}>
                    <td style={{ color: "var(--text-muted)" }}>
                      #{c.customer_id}
                    </td>
                    <td>
                      <strong>
                        {c.title} {c.first_name} {c.last_name}
                      </strong>
                    </td>
                    <td>{c.date_of_birth}</td>
                    <td>{c.age}</td>
                    <td>{c.phone}</td>
                    <td>{c.email || <span className="text-muted">—</span>}</td>
                    <td>
                      {c.nhs_number || <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            navigate(`/customers/${c.customer_id}`)
                          }
                        >
                          View
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setModal(c)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {data.total_pages > 1 && (
          <div className="pagination">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              ‹ Prev
            </button>
            {Array.from({ length: data.total_pages }, (_, i) => i + 1).map(
              (n) => (
                <button
                  key={n}
                  className={n === page ? "active" : ""}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ),
            )}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === data.total_pages}
            >
              Next ›
            </button>
          </div>
        )}
      </div>

      {modal && (
        <CustomerModal
          initial={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
