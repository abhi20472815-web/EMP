import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Filter, UserPlus, Phone, MapPin, Mail, Trash2, Edit, AlertCircle } from 'lucide-react';

const Employees = () => {
  const { user, authFetch } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Inline editing states
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Form States for new employee creation
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: 'Engineering',
    designation: 'Software Engineer',
    salary: 60000,
    phone: '',
    address: '',
    manager: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
  });
  const [managersList, setManagersList] = useState([]);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch employees list
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let url = '/employees';
      const params = [];
      if (selectedDept) params.push(`department=${selectedDept}`);
      if (selectedRole) params.push(`role=${selectedRole}`);
      if (selectedStatus) params.push(`status=${selectedStatus}`);
      if (searchTerm) params.push(`search=${searchTerm}`);

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await authFetch(url);
      if (res.success) {
        setEmployees(res.data);
        
        // Extract potential managers (everyone with manager or admin role)
        const managers = res.data.filter(e => ['admin', 'manager'].includes(e.role));
        setManagersList(managers);
      }
    } catch (err) {
      console.error('Error fetching employee list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDept, selectedRole, selectedStatus, searchTerm]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add new employee
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.name || !formData.email) {
      setFormError('Name and Email are required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        role: formData.role,
        department: formData.department,
        designation: formData.designation,
        salary: Number(formData.salary),
        phone: formData.phone,
        address: formData.address,
        manager: formData.manager || null,
        emergencyContact: {
          name: formData.emergencyContactName,
          relation: formData.emergencyContactRelation,
          phone: formData.emergencyContactPhone,
        },
      };

      const res = await authFetch('/employees', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setEmployees(prev => [res.data, ...prev]);
        setShowAddModal(false);
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'employee',
          department: 'Engineering',
          designation: 'Software Engineer',
          salary: 60000,
          phone: '',
          address: '',
          manager: '',
          emergencyContactName: '',
          emergencyContactRelation: '',
          emergencyContactPhone: '',
        });
      } else {
        setFormError(res.error || 'Failed to register employee');
      }
    } catch (err) {
      setFormError(err.message || 'Server connection error');
    } finally {
      setFormLoading(false);
    }
  };

  // Save inline name edits
  const handleSaveName = async (id) => {
    if (!editingName.trim()) {
      alert('Name cannot be empty.');
      return;
    }

    try {
      const res = await authFetch(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingName }),
      });

      if (res.success) {
        setEmployees(prev => prev.map(e => {
          let updatedEmployee = e._id === id ? { ...e, name: res.data.name } : e;
          // If this employee reports to the one whose name was edited, update manager name reference
          if (updatedEmployee.manager && updatedEmployee.manager._id === id) {
            updatedEmployee = {
              ...updatedEmployee,
              manager: {
                ...updatedEmployee.manager,
                name: res.data.name
              }
            };
          }
          return updatedEmployee;
        }));
        
        // Also update the managers list used in dropdowns
        setManagersList(prev => prev.map(m => m._id === id ? { ...m, name: res.data.name } : m));
        
        setEditingId(null);
      } else {
        alert(res.error || 'Failed to update employee name');
      }
    } catch (err) {
      alert(err.message || 'Server connection error');
    }
  };

  // Hard delete employee (Admin only)
  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${name}'s records permanently from the system database?`)) return;

    try {
      const res = await authFetch(`/employees/${id}`, { method: 'DELETE' });
      if (res.success) {
        setEmployees(prev => prev.filter(e => e._id !== id));
      }
    } catch (err) {
      alert('Error deleting employee: ' + err.message);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EM';
  };

  return (
    <div className="content-viewport">
      <div className="flex-between mb-6">
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>Workforce Directory</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Browse profiles, manage structures, and filter departments.
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} /> Register Employee
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-panel mb-6" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ minWidth: '150px', padding: '0.75rem 2.5rem 0.75rem 1.2rem' }}
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
          </select>

          <select
            className="form-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{ minWidth: '130px', padding: '0.75rem 2.5rem 0.75rem 1.2rem' }}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>

          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ minWidth: '120px', padding: '0.75rem 2.5rem 0.75rem 1.2rem' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Directory Content */}
      {loading ? (
        <p className="text-muted" style={{ textAlign: 'center', padding: '4rem' }}>Filtering directory profiles...</p>
      ) : employees.length > 0 ? (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Contact Info</th>
                  <th>Hierarchy Details</th>
                  <th>Payroll Status</th>
                  <th>System Role</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="user-avatar" style={{ border: `2px solid ${emp.status === 'active' ? 'var(--accent-success)' : 'var(--accent-danger)'}` }}>
                          {getInitials(emp.name)}
                        </div>
                        <div>
                          {editingId === emp._id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0.2rem 0' }}>
                              <input
                                type="text"
                                className="form-input"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                style={{
                                  padding: '0.15rem 0.4rem',
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  width: '160px',
                                  height: '28px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-primary)'
                                }}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveName(emp._id);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                              />
                              <button
                                className="btn btn-primary"
                                onClick={() => handleSaveName(emp._id)}
                                style={{ padding: '0.15rem 0.35rem', height: '28px', minWidth: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', background: 'var(--accent-emerald)', border: 'none' }}
                                title="Save Name"
                              >
                                ✓
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => setEditingId(null)}
                                style={{ padding: '0.15rem 0.35rem', height: '28px', minWidth: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 600, display: 'block', fontSize: '1rem' }}>{emp.name}</span>
                              <button 
                                onClick={() => {
                                  setEditingId(emp._id);
                                  setEditingName(emp.name);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0.2rem',
                                  cursor: 'pointer',
                                  color: 'var(--text-secondary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  opacity: 0.6,
                                  transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                                title="Edit Name"
                              >
                                <Edit size={12} />
                              </button>
                            </div>
                          )}
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{emp.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.85rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Mail size={12} className="text-muted" /> {emp.email}
                        </span>
                        {emp.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Phone size={12} className="text-muted" /> {emp.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 500 }}>{emp.department}</span>
                        {emp.manager && (
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            Report: {emp.manager.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600 }}>₹{emp.salary?.toLocaleString('en-IN')} / yr</span>
                        <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ alignSelf: 'flex-start', padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>
                          <span className="badge-dot"></span>
                          {emp.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${emp.role === 'admin' ? 'badge-danger' : emp.role === 'manager' ? 'badge-pending' : 'badge-info'}`}>
                        <span className="badge-dot"></span>
                        {emp.role}
                      </span>
                    </td>
                    
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingId(emp._id);
                            setEditingName(emp.name);
                          }}
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
                          title="Edit Name"
                        >
                          <Edit size={14} />
                        </button>
                        {user.role === 'admin' && (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                            style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p className="text-muted">No workforce profiles match the selected filtering filters.</p>
        </div>
      )}

      {/* Extensive Create Employee Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ maxWidth: '800px' }}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>Register New Corporate Employee</h3>

            {formError && (
              <div className="badge badge-danger mb-4" style={{ display: 'flex', width: '100%', padding: '0.75rem', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEmployee}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Personal Information */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                    Personal Details
                  </h4>
                  
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="E.g., Bruce Wayne"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Work Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="bruce@wayne.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Security Password</label>
                    <input
                      type="password"
                      name="password"
                      className="form-input"
                      placeholder="Welcome123! (default if empty)"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Residential Address</label>
                    <textarea
                      name="address"
                      className="form-textarea"
                      placeholder="Wayne Manor, Gotham City"
                      value={formData.address}
                      onChange={handleInputChange}
                      style={{ minHeight: '60px' }}
                    ></textarea>
                  </div>
                </div>

                {/* Job & Professional parameters */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                    Job Parameters
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Corporate Role</label>
                    <select
                      name="role"
                      className="form-select"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="employee">Standard Employee</option>
                      <option value="manager">Department Manager</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department Division</label>
                    <select
                      name="department"
                      className="form-select"
                      value={formData.department}
                      onChange={handleInputChange}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Designation</label>
                    <input
                      type="text"
                      name="designation"
                      className="form-input"
                      placeholder="E.g., Senior Systems Analyst"
                      value={formData.designation}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Annual Gross Salary (₹)</label>
                    <input
                      type="number"
                      name="salary"
                      className="form-input"
                      placeholder="60000"
                      value={formData.salary}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Supervisor</label>
                    <select
                      name="manager"
                      className="form-select"
                      value={formData.manager}
                      onChange={handleInputChange}
                    >
                      <option value="">None / Select Supervisor</option>
                      {managersList.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                  Emergency Contact Configurations
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      className="form-input"
                      placeholder="Alfred Pennyworth"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Relationship</label>
                    <input
                      type="text"
                      name="emergencyContactRelation"
                      className="form-input"
                      placeholder="Butler / Friend"
                      value={formData.emergencyContactRelation}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="text"
                      name="emergencyContactPhone"
                      className="form-input"
                      placeholder="+91 98765 01234"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Discard
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
