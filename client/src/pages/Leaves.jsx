import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Send, ShieldAlert, Check, X, AlertCircle } from 'lucide-react';

const Leaves = () => {
  const { user, authFetch } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States for Employee submission
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Action States for Admin/Manager
  const [commentModalId, setCommentModalId] = useState(null);
  const [approverComment, setApproverComment] = useState('');
  const [approverActionStatus, setApproverActionStatus] = useState(''); // 'Approved' or 'Rejected'
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Leaves histories
  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/leaves');
      if (res.success) {
        setLeaves(res.data);
      }
    } catch (err) {
      console.error('Error fetching leaves history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Submit leave application
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!startDate || !endDate || !reason) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date cannot be after end date');
      return;
    }

    setFormLoading(true);
    try {
      const res = await authFetch('/leaves', {
        method: 'POST',
        body: JSON.stringify({
          type: leaveType,
          startDate,
          endDate,
          reason,
        }),
      });

      if (res.success) {
        setFormSuccess('Leave application submitted successfully for supervisor review!');
        // Update list
        // Since we populate employeeId inside leaveController, let's append ourselves locally
        const newLeave = {
          ...res.data,
          employeeId: {
            name: user.name,
            designation: user.designation,
            department: user.department,
          },
        };
        setLeaves(prev => [newLeave, ...prev]);
        
        // Reset form
        setLeaveType('Casual');
        setStartDate('');
        setEndDate('');
        setReason('');
      } else {
        setFormError(res.error || 'Failed to submit leave request');
      }
    } catch (err) {
      setFormError(err.message || 'Connection error');
    } finally {
      setFormLoading(false);
    }
  };

  // Open comments box for approval/rejection
  const openActionModal = (id, status) => {
    setCommentModalId(id);
    setApproverActionStatus(status);
    setApproverComment('');
  };

  // Process Approval/Rejection request
  const handleProcessLeave = async (e) => {
    e.preventDefault();
    if (!commentModalId) return;

    setActionLoading(true);
    try {
      const res = await authFetch(`/leaves/${commentModalId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: approverActionStatus,
          comment: approverComment,
        }),
      });

      if (res.success) {
        // Update item locally
        setLeaves(prev =>
          prev.map((l) => (l._id === commentModalId ? res.data : l))
        );
        setCommentModalId(null);
      }
    } catch (err) {
      alert('Error updating leave status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EM';
  };

  return (
    <div className="content-viewport">
      <div className="flex-between mb-6">
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>Leave Planning Board</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
            {user.role === 'employee' 
              ? 'Submit time-off requests and track approval statuses.' 
              : 'Review and audit time-off applications from workforce teams.'}
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Side: Submit Request (Employee) or Review Actions (Manager/Admin) */}
        {user.role === 'employee' ? (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 className="section-title">Apply for Time-Off</h3>

            {formError && (
              <div className="badge badge-danger mb-4" style={{ display: 'flex', width: '100%', padding: '0.75rem', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="badge badge-success mb-4" style={{ display: 'flex', width: '100%', padding: '0.75rem', gap: '0.5rem' }}>
                <Check size={16} />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave}>
              <div className="form-group">
                <label className="form-label">Leave Category</label>
                <select
                  className="form-select"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Annual">Annual Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Reason / Justification</label>
                <textarea
                  className="form-textarea"
                  placeholder="Explain why you are applying for leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  style={{ minHeight: '110px' }}
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={formLoading}
              >
                <Send size={16} /> {formLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        ) : (
          /* Manager / Admin instructions card */
          <div className="glass-panel stat-primary" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '300px' }}>
            <div className="stat-card-icon-container" style={{ width: '70px', height: '70px', borderRadius: '50%', marginBottom: '1.5rem', alignSelf: 'center' }}>
              <Calendar size={32} />
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '1.4rem' }}>Workforce Planning Portal</h3>
            <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Review the complete registry of leave history in the right-hand panel. Click <strong style={{ color: 'var(--accent-success)' }}>Approve</strong> or <strong style={{ color: 'var(--accent-danger)' }}>Reject</strong> in the records list to attach auditor commentary and finalize pending requests immediately.
            </p>
          </div>
        )}

        {/* Right Side: Quick overview statistics */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="section-title">Leave Allocations</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Reference guidelines for standard corporate allocations.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', flex: 1 }}>
            <div className="flex-between glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed' }}>
              <span style={{ fontWeight: 500 }}>Annual Leave (Vacations)</span>
              <span className="badge badge-success">21 Days Allocated</span>
            </div>
            <div className="flex-between glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed' }}>
              <span style={{ fontWeight: 500 }}>Casual Leave</span>
              <span className="badge badge-info">10 Days Allocated</span>
            </div>
            <div className="flex-between glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed' }}>
              <span style={{ fontWeight: 500 }}>Sick / Medical Leave</span>
              <span className="badge badge-pending">12 Days Allocated</span>
            </div>
          </div>
        </div>
      </div>

      {/* History Registry Table */}
      <div className="glass-panel mt-6" style={{ padding: '2rem' }}>
        <h3 className="section-title">Leave History Registry</h3>
        {loading ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '3rem' }}>Fetching leave histories...</p>
        ) : leaves.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason Details</th>
                  <th>Status</th>
                  <th>Comments</th>
                  {['admin', 'manager'].includes(user.role) && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => {
                  const isPending = leave.status === 'Pending';
                  const isRequester = leave.employeeId?._id === user._id;

                  return (
                    <tr key={leave._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                            {getInitials(leave.employeeId?.name)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, display: 'block' }}>{leave.employeeId?.name}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{leave.employeeId?.department}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          <span className="badge-dot"></span>
                          {leave.type}
                        </span>
                      </td>
                      <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td>
                        <span title={leave.reason} style={{ display: 'inline-block', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {leave.reason}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          leave.status === 'Approved' 
                            ? 'badge-success' 
                            : leave.status === 'Rejected' 
                            ? 'badge-danger' 
                            : 'badge-pending'
                        }`}>
                          <span className="badge-dot"></span>
                          {leave.status}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {leave.comment || 'No auditor comments.'}
                      </td>

                      {['admin', 'manager'].includes(user.role) && (
                        <td style={{ textAlign: 'right' }}>
                          {isPending ? (
                            !isRequester ? (
                              <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                <button
                                  className="btn btn-success"
                                  onClick={() => openActionModal(leave._id, 'Approved')}
                                  style={{ padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
                                  title="Approve Leave"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => openActionModal(leave._id, 'Rejected')}
                                  style={{ padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
                                  title="Reject Leave"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Self request</span>
                            )
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Audited
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }} className="text-muted">
            No leave request entries recorded.
          </div>
        )}
      </div>

      {/* Auditor Comment Modal */}
      {commentModalId && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ maxWidth: '480px' }}>
            <button className="modal-close" onClick={() => setCommentModalId(null)}>×</button>
            <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>
              Process Time-Off Request: {approverActionStatus}
            </h3>

            <form onSubmit={handleProcessLeave}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Auditor Comments (Optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Explain comments, details, or reasons..."
                  value={approverComment}
                  onChange={(e) => setApproverComment(e.target.value)}
                  style={{ minHeight: '100px' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setCommentModalId(null)}
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className={`btn ${approverActionStatus === 'Approved' ? 'btn-success' : 'btn-danger'}`}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Auditing...' : `Confirm ${approverActionStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
