import { useEffect, useState, useCallback } from "react";

const API = process.env.REACT_APP_API_URL;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  };
}

function Badge({ text, color }) {
  const colors = {
    pending:  { bg: "#f59e0b20", text: "#f59e0b" },
    approved: { bg: "#10b98120", text: "#10b981" },
    disabled: { bg: "#ef444420", text: "#ef4444" },
    manager:       { bg: "#00acc120", text: "#00acc1" },
    owner:         { bg: "#8b5cf620", text: "#8b5cf6" },
    group_manager: { bg: "#f59e0b20", text: "#f59e0b" },
  };
  const c = colors[text] || colors[color] || { bg: "#94a3b820", text: "#94a3b8" };
  return (
    <span style={{ background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600 }}>
      {text}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminStakeholders() {
  const [stakeholders, setStakeholders] = useState([]);
  const [hotels,       setHotels]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null); // 'create' | 'approve' | 'edit'
  const [selected,     setSelected]     = useState(null);
  const [actionMsg,    setActionMsg]    = useState("");

  // Form state for create/approve modals
  const [formName,      setFormName]      = useState("");
  const [formEmail,     setFormEmail]     = useState("");
  const [formRole,      setFormRole]      = useState("manager");
  const [formHotels,    setFormHotels]    = useState([]);
  const [formPowerbiUrl, setFormPowerbiUrl] = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [formError,     setFormError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sh, ht] = await Promise.all([
        fetch(`${API}/api/admin/stakeholders`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/api/admin/hotels`,       { headers: authHeaders() }).then(r => r.json()),
      ]);
      setStakeholders(Array.isArray(sh) ? sh : []);
      setHotels(Array.isArray(ht) ? ht : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending  = stakeholders.filter(s => s.status === "pending");
  const approved = stakeholders.filter(s => s.status !== "pending");

  const flash = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(""), 3000); };

  const toggleHotel = (h) =>
    setFormHotels(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);

  const closeModal = () => {
    setModal(null); setSelected(null);
    setFormName(""); setFormEmail(""); setFormRole("manager");
    setFormHotels([]); setFormPowerbiUrl(""); setFormError("");
  };

  const openApprove = (s) => {
    setSelected(s);
    setFormHotels([]);
    setFormPowerbiUrl("");
    setFormError("");
    setModal("approve");
  };

  const openEdit = (s) => {
    setSelected(s);
    setFormHotels(s.hotels || []);
    setFormPowerbiUrl(s.powerbi_url || "");
    setFormError("");
    setModal("edit");
  };

  const handleApprove = async () => {
    if (!formHotels.length) return setFormError("Select at least one hotel.");
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/admin/stakeholders/${selected.id}/approve`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ hotels: formHotels, powerbi_url: formPowerbiUrl || null }),
      });
      const d = await r.json();
      if (!r.ok) return setFormError(d.message || "Error");
      flash("✅ Approved — credentials emailed to stakeholder");
      closeModal(); load();
    } catch { setFormError("Network error"); }
    finally { setSubmitting(false); }
  };

  const handleCreate = async () => {
    if (!formName || !formEmail || !formHotels.length)
      return setFormError("Name, email and at least one hotel are required.");
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/admin/stakeholders`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ name: formName, email: formEmail, role: formRole, hotels: formHotels, powerbi_url: formPowerbiUrl || null }),
      });
      const d = await r.json();
      if (!r.ok) return setFormError(d.message || "Error");
      flash("✅ Stakeholder created — credentials emailed");
      closeModal(); load();
    } catch { setFormError("Network error"); }
    finally { setSubmitting(false); }
  };

  const handleEditSave = async () => {
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/admin/stakeholders/${selected.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ hotels: formHotels, powerbi_url: formPowerbiUrl }),
      });
      if (!r.ok) return setFormError("Error updating");
      flash("✅ Hotels updated");
      closeModal(); load();
    } catch { setFormError("Network error"); }
    finally { setSubmitting(false); }
  };

  const handleDisable = async (s) => {
    const newStatus = s.status === "disabled" ? "approved" : "disabled";
    await fetch(`${API}/api/admin/stakeholders/${s.id}`, {
      method: "PUT", headers: authHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });
    flash(`${newStatus === "disabled" ? "⛔ Disabled" : "✅ Re-enabled"} ${s.name}`);
    load();
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    await fetch(`${API}/api/admin/stakeholders/${s.id}`, { method: "DELETE", headers: authHeaders() });
    flash(`🗑 Deleted ${s.name}`);
    load();
  };

  const handleReject = async (s) => {
    if (!window.confirm(`Reject and delete request from ${s.name}?`)) return;
    await fetch(`${API}/api/admin/stakeholders/${s.id}`, { method: "DELETE", headers: authHeaders() });
    flash(`Request from ${s.name} rejected`);
    load();
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
    fontSize: "0.9rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  const HotelCheckboxes = () => (
    <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {hotels.length === 0
        ? <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading hotels…</span>
        : hotels.map(h => (
          <label key={h} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.85rem", color: "#374151" }}>
            <input type="checkbox" checked={formHotels.includes(h)} onChange={() => toggleHotel(h)} />
            {h}
          </label>
        ))
      }
    </div>
  );

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Stakeholder Management</h1>
          <p className="ap-page-sub">Manage hotel partner accounts and pending access requests</p>
        </div>
        <button className="ap-btn-primary" onClick={() => setModal("create")}>+ Add Stakeholder</button>
      </div>

      {actionMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", color: "#15803d", marginBottom: 20, fontSize: "0.9rem" }}>
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div className="ap-page-loading">Loading stakeholders…</div>
      ) : (
        <>
          {/* Pending requests */}
          {pending.length > 0 && (
            <div className="ap-card" style={{ marginBottom: 24 }}>
              <div className="ap-card-header">
                <h2 className="ap-card-title">Pending Requests</h2>
                <span style={{ background: "#f59e0b20", color: "#f59e0b", padding: "3px 12px", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700 }}>
                  {pending.length} pending
                </span>
              </div>
              <table className="ap-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Hotel Requested</th><th>Message</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {pending.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td className="ap-td-muted">{s.email}</td>
                      <td><Badge text={s.role} /></td>
                      <td style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{s.hotel_name || <span className="ap-td-muted">—</span>}</td>
                      <td className="ap-td-muted" style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.message || "—"}</td>
                      <td className="ap-td-muted ap-td-nowrap">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="ap-btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }} onClick={() => openApprove(s)}>Approve</button>
                          <button className="ap-btn-danger"  style={{ padding: "6px 14px", fontSize: "0.8rem" }} onClick={() => handleReject(s)}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Approved stakeholders */}
          <div className="ap-card">
            <div className="ap-card-header">
              <h2 className="ap-card-title">All Stakeholders</h2>
              <span className="ap-card-hint">{approved.length} account{approved.length !== 1 ? "s" : ""}</span>
            </div>
            {approved.length === 0 ? (
              <div className="ap-empty">No stakeholder accounts yet. Use "Add Stakeholder" to create one manually, or approve a pending request above.</div>
            ) : (
              <table className="ap-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Hotels</th><th>Power BI</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {approved.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td className="ap-td-muted">{s.email}</td>
                      <td><Badge text={s.role} /></td>
                      <td style={{ fontSize: "0.82rem", color: "#374151" }}>
                        {s.hotels?.length ? s.hotels.join(", ") : <span className="ap-td-muted">None</span>}
                      </td>
                      <td>
                        {s.powerbi_url
                          ? <a href={s.powerbi_url} target="_blank" rel="noreferrer" style={{ color: "#00acc1", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none" }}>✓ Set</a>
                          : <span className="ap-td-muted" style={{ fontSize: "0.78rem" }}>Not set</span>}
                      </td>
                      <td><Badge text={s.status} /></td>
                      <td className="ap-td-muted ap-td-nowrap">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="ap-btn-secondary" style={{ padding: "5px 12px", fontSize: "0.78rem" }} onClick={() => openEdit(s)}>Edit</button>
                          <button className="ap-btn-secondary" style={{ padding: "5px 12px", fontSize: "0.78rem" }} onClick={() => handleDisable(s)}>
                            {s.status === "disabled" ? "Enable" : "Disable"}
                          </button>
                          <button className="ap-btn-danger" style={{ padding: "5px 12px", fontSize: "0.78rem" }} onClick={() => handleDelete(s)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Create Modal */}
      {modal === "create" && (
        <Modal title="Add New Stakeholder" onClose={closeModal}>
          {formError && <div style={{ color: "#dc2626", fontSize: "0.85rem", marginBottom: 16 }}>{formError}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Full Name *</label>
              <input style={inputStyle} value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Jean-Pierre Morel" /></div>
            <div><label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Email *</label>
              <input style={inputStyle} type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="manager@hotel.com" /></div>
            <div><label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Role</label>
              <select style={inputStyle} value={formRole} onChange={e => setFormRole(e.target.value)}>
                <option value="manager">General Manager</option>
                <option value="owner">Owner</option>
                <option value="group_manager">Group Manager</option>
              </select></div>
            <div><label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Assign Hotels * ({formHotels.length} selected)</label>
              <HotelCheckboxes /></div>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Power BI Dashboard URL <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional — paste after sharing via Power BI)</span></label>
              <input style={inputStyle} value={formPowerbiUrl} onChange={e => setFormPowerbiUrl(e.target.value)} placeholder="https://app.powerbi.com/..." />
            </div>
            <button
              onClick={handleCreate} disabled={submitting}
              style={{ background: submitting ? "#94a3b8" : "#00acc1", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, cursor: "pointer", marginTop: 4 }}
            >
              {submitting ? "Creating…" : "Create & Send Email"}
            </button>
          </div>
        </Modal>
      )}

      {/* Approve Modal */}
      {modal === "approve" && selected && (
        <Modal title={`Approve — ${selected.name}`} onClose={closeModal}>
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 20, fontSize: "0.85rem", color: "#374151" }}>
            <strong>{selected.name}</strong> — {selected.email}<br />
            <span style={{ color: "#64748b" }}>{selected.message || "No message provided"}</span>
          </div>
          {formError && <div style={{ color: "#dc2626", fontSize: "0.85rem", marginBottom: 12 }}>{formError}</div>}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Assign Hotels * ({formHotels.length} selected)</label>
            <HotelCheckboxes />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Power BI Dashboard URL <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional — paste after sharing via Power BI)</span></label>
            <input style={inputStyle} value={formPowerbiUrl} onChange={e => setFormPowerbiUrl(e.target.value)} placeholder="https://app.powerbi.com/..." />
          </div>
          <button
            onClick={handleApprove} disabled={submitting}
            style={{ width: "100%", background: submitting ? "#94a3b8" : "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, cursor: "pointer" }}
          >
            {submitting ? "Approving…" : "Approve & Send Credentials"}
          </button>
        </Modal>
      )}

      {/* Edit Modal */}
      {modal === "edit" && selected && (
        <Modal title={`Edit — ${selected.name}`} onClose={closeModal}>
          {formError && <div style={{ color: "#dc2626", fontSize: "0.85rem", marginBottom: 12 }}>{formError}</div>}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Hotels ({formHotels.length} selected)</label>
            <HotelCheckboxes />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Power BI Dashboard URL</label>
            <input style={inputStyle} value={formPowerbiUrl} onChange={e => setFormPowerbiUrl(e.target.value)} placeholder="https://app.powerbi.com/..." />
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "6px 0 0" }}>
              Paste the URL from Power BI's Share feature. The stakeholder will see a button to open it in their dashboard.
            </p>
          </div>
          <button
            onClick={handleEditSave} disabled={submitting}
            style={{ width: "100%", background: submitting ? "#94a3b8" : "#00acc1", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, cursor: "pointer" }}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </Modal>
      )}
    </div>
  );
}
