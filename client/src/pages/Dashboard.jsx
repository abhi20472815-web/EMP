import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Layers, 
  DollarSign, 
  Calendar, 
  Megaphone,
  Plus,
  Trash2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const Dashboard = () => {
  const { user, authFetch } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    departmentsCount: 0,
    monthlyPayroll: 0,
    pendingLeaves: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [notices, setNotices] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [empPerformance, setEmpPerformance] = useState(null);
  
  // Announcement Creation Form State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeTarget, setNoticeTarget] = useState('All');
  const [loadingAction, setLoadingAction] = useState(false);

  // Fetch Dashboard data
  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Employees list to compute stats
      const empRes = await authFetch('/employees');
      if (empRes.success) {
        const list = empRes.data;
        const total = list.length;
        
        // Find unique departments
        const depts = new Set(list.map(e => e.department));
        const deptsCount = depts.size;
        
        // Sum payroll
        const totalSal = list.reduce((acc, curr) => acc + (curr.salary || 0), 0);
        const monthly = Math.round(totalSal / 12);

        // Chart Data - Employees count by department
        const deptDistribution = {};
        list.forEach(e => {
          deptDistribution[e.department] = (deptDistribution[e.department] || 0) + 1;
        });
        const dChart = Object.keys(deptDistribution).map(dept => ({
          name: dept,
          employees: deptDistribution[dept],
        }));

        setStats(prev => ({
          ...prev,
          totalEmployees: total,
          departmentsCount: deptsCount,
          monthlyPayroll: monthly,
        }));
        setChartData(dChart);
      }

      // 2. Fetch Leaves
      const leaveRes = await authFetch('/leaves');
      if (leaveRes.success) {
        const pending = leaveRes.data.filter(l => l.status === 'Pending').length;
        setStats(prev => ({ ...prev, pendingLeaves: pending }));
        // Keep first 4 leaves
        setLeaves(leaveRes.data.slice(0, 4));
      }

      // 3. Fetch Notices
      const noticeRes = await authFetch('/notices');
      if (noticeRes.success) {
        setNotices(noticeRes.data);
      }

      // 4. If standard employee, fetch their specific performance review average score
      if (user.role === 'employee') {
        const perfRes = await authFetch(`/performance/stats/${user._id}`);
        if (perfRes.success) {
          setEmpPerformance(perfRes.data.averageRatings);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Post new notice announcement
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;

    setLoadingAction(true);
    try {
      const res = await authFetch('/notices', {
        method: 'POST',
        body: JSON.stringify({
          title: noticeTitle,
          content: noticeContent,
          targetRoles: noticeTarget,
        }),
      });

      if (res.success) {
        setNotices(prev => [res.data, ...prev]);
        setNoticeTitle('');
        setNoticeContent('');
        setNoticeTarget('All');
        setShowNoticeModal(false);
      }
    } catch (error) {
      alert('Error creating notice: ' + error.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete notice announcement (Admin only)
  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      const res = await authFetch(`/notices/${id}`, { method: 'DELETE' });
      if (res.success) {
        setNotices(prev => prev.filter(n => n._id !== id));
      }
    } catch (error) {
      alert('Error deleting notice: ' + error.message);
    }
  };

  // Quick action to approve/reject leaves from dashboard
  const handleQuickLeaveAction = async (id, status) => {
    try {
      const res = await authFetch(`/leaves/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, comment: `Processed via Quick Actions Dashboard.` }),
      });

      if (res.success) {
        // Refresh
        fetchDashboardData();
      }
    } catch (error) {
      alert('Action failed: ' + error.message);
    }
  };

  // Custom Colors for Charts
  const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  // Helper to extract initials
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EM';
  };

  // --- RENDERS ---

  // 1. Admin/Manager Dashboard View
  const renderManagementDashboard = () => (
    <div>
      {/* Metric Stat Cards */}
      <div className="stat-grid">
        <div className="glass-panel stat-card stat-primary">
          <div className="stat-card-info">
            <span className="stat-card-title">Total Workforce</span>
            <span className="stat-card-value">{stats.totalEmployees}</span>
          </div>
          <div className="stat-card-icon-container">
            <Users className="stat-card-icon" />
          </div>
        </div>

        <div className="glass-panel stat-card stat-secondary">
          <div className="stat-card-info">
            <span className="stat-card-title">Departments</span>
            <span className="stat-card-value">{stats.departmentsCount}</span>
          </div>
          <div className="stat-card-icon-container">
            <Layers className="stat-card-icon" />
          </div>
        </div>

        <div className="glass-panel stat-card stat-success">
          <div className="stat-card-info">
            <span className="stat-card-title">Monthly Budget</span>
            <span className="stat-card-value">₹{stats.monthlyPayroll.toLocaleString('en-IN')}</span>
          </div>
          <div className="stat-card-icon-container">
            <DollarSign className="stat-card-icon" />
          </div>
        </div>

        <div className="glass-panel stat-card stat-danger">
          <div className="stat-card-info">
            <span className="stat-card-title">Pending Leaves</span>
            <span className="stat-card-value">{stats.pendingLeaves}</span>
          </div>
          <div className="stat-card-icon-container">
            <Calendar className="stat-card-icon" />
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Dynamic Recharts Bar Chart */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 className="section-title">Department Distribution</h3>
          {chartData.length > 0 ? (
            <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1e293b', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '8px', 
                      color: 'white' 
                    }} 
                  />
                  <Bar dataKey="employees" fill="url(#colorEmployees)" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Scaffolding data charts...</p>
          )}
        </div>

        {/* Notices Board */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Announcements</h3>
            {user.role === 'admin' && (
              <button 
                className="btn btn-primary" 
                onClick={() => setShowNoticeModal(true)}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              >
                <Plus size={16} /> Add Notice
              </button>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', paddingRight: '0.25rem' }}>
            {notices.length > 0 ? (
              notices.map((notice) => (
                <div key={notice._id} className="glass-panel notice-card" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div className="notice-header">
                    <h4 className="notice-title">{notice.title}</h4>
                    {user.role === 'admin' && (
                      <button 
                        className="btn-icon-only" 
                        onClick={() => handleDeleteNotice(notice._id)}
                        style={{ width: '28px', height: '28px', color: 'var(--accent-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="notice-body">{notice.content}</p>
                  <div className="notice-meta">
                    <span className="notice-author">By: {notice.authorId?.name || 'HR Admin'}</span>
                    <span>•</span>
                    <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      To: {notice.targetRoles}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No notices published yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Pending Leaves Panel */}
      <div className="glass-panel mt-6" style={{ padding: '2rem' }}>
        <h3 className="section-title">Quick Action: Pending Leaves</h3>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.filter(l => l.status === 'Pending').length > 0 ? (
                leaves.filter(l => l.status === 'Pending').map((leave) => (
                  <tr key={leave._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                          {getInitials(leave.employeeId?.name)}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, display: 'block' }}>{leave.employeeId?.name}</span>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{leave.employeeId?.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td>{leave.employeeId?.department}</td>
                    <td>
                      <span className="badge badge-info">
                        <span className="badge-dot"></span>
                        {leave.type}
                      </span>
                    </td>
                    <td>
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span title={leave.reason} style={{ display: 'inline-block', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {leave.reason}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-success" 
                          onClick={() => handleQuickLeaveAction(leave._id, 'Approved')}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleQuickLeaveAction(leave._id, 'Rejected')}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                    No pending leave requests found requiring action.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 2. Employee Dashboard View
  const renderEmployeeDashboard = () => (
    <div>
      {/* Metric Cards */}
      <div className="stat-grid">
        <div className="glass-panel stat-card stat-primary">
          <div className="stat-card-info">
            <span className="stat-card-title">My Gross Salary</span>
            <span className="stat-card-value">₹{user.salary?.toLocaleString('en-IN') || '50,000'}</span>
          </div>
          <div className="stat-card-icon-container">
            <DollarSign className="stat-card-icon" />
          </div>
        </div>

        <div className="glass-panel stat-card stat-success">
          <div className="stat-card-info">
            <span className="stat-card-title">Overall Performance Rating</span>
            <span className="stat-card-value">
              {empPerformance ? empPerformance.overall : 'N/A'}/5.0
            </span>
          </div>
          <div className="stat-card-icon-container">
            <TrendingUp className="stat-card-icon" />
          </div>
        </div>

        <div className="glass-panel stat-card stat-cyan">
          <div className="stat-card-info">
            <span className="stat-card-title">Assigned Supervisor</span>
            <span className="stat-card-value" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {user.manager ? user.manager.name.split(' ')[0] + ' ' + user.manager.name.split(' ')[1] : ' Sarah Connor'}
            </span>
          </div>
          <div className="stat-card-icon-container">
            <Users className="stat-card-icon" />
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Notices Board */}
        <div className="glass-panel" style={{ padding: '2rem', maxHeight: '420px', overflowY: 'auto' }}>
          <h3 className="section-title">Notice Bulletin</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {notices.length > 0 ? (
              notices.map((notice) => (
                <div key={notice._id} className="glass-panel notice-card" style={{ background: 'rgba(255,255,255,0.01)', margin: 0 }}>
                  <h4 className="notice-title">{notice.title}</h4>
                  <p className="notice-body">{notice.content}</p>
                  <div className="notice-meta">
                    <span className="notice-author">By: {notice.authorId?.name}</span>
                    <span>•</span>
                    <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No bulletin announcements posted.</p>
            )}
          </div>
        </div>

        {/* Dynamic Performance category chart */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 className="section-title">Performance Metrics Breakdown</h3>
          {empPerformance ? (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Quality of Work</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{empPerformance.qualityOfWork} / 5.0</span>
                </div>
                <div className="gauge-track">
                  <div className="gauge-bar gauge-bar-primary" style={{ width: `${(empPerformance.qualityOfWork / 5) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Communication</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{empPerformance.communication} / 5.0</span>
                </div>
                <div className="gauge-track">
                  <div className="gauge-bar gauge-bar-primary" style={{ width: `${(empPerformance.communication / 5) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Teamwork</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{empPerformance.teamwork} / 5.0</span>
                </div>
                <div className="gauge-track">
                  <div className="gauge-bar gauge-bar-primary" style={{ width: `${(empPerformance.teamwork / 5) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Dependability</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{empPerformance.dependability} / 5.0</span>
                </div>
                <div className="gauge-track">
                  <div className="gauge-bar gauge-bar-primary" style={{ width: `${(empPerformance.dependability / 5) * 100}%` }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p className="text-muted">No review audits submitted yet for your profile.</p>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Ratings will appear as soon as your manager logs your periodic audit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Leave Request overview */}
      <div className="glass-panel mt-6" style={{ padding: '2rem' }}>
        <h3 className="section-title">My Recent Leaves</h3>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Review Status</th>
                <th>Approver Comments</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length > 0 ? (
                leaves.map((leave) => (
                  <tr key={leave._id}>
                    <td>
                      <span className="badge badge-info">
                        <span className="badge-dot"></span>
                        {leave.type}
                      </span>
                    </td>
                    <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                    <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                    <td>{leave.reason}</td>
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
                    <td className="text-muted">{leave.comment || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                    No leave requests submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="content-viewport">
      {user.role === 'employee' ? renderEmployeeDashboard() : renderManagementDashboard()}

      {/* Stunning Notice Modal */}
      {showNoticeModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel">
            <button className="modal-close" onClick={() => setShowNoticeModal(false)}>×</button>
            <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>Publish Notice Announcement</h3>
            
            <form onSubmit={handleCreateNotice}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Notice Title</label>
                <input
                  type="text"
                  id="title"
                  className="form-input"
                  placeholder="E.g., Office Maintenance Schedule"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="content">Notice Content Details</label>
                <textarea
                  id="content"
                  className="form-textarea"
                  placeholder="Explain details of announcement here..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="target">Audience Targeting</label>
                <select
                  id="target"
                  className="form-select"
                  value={noticeTarget}
                  onChange={(e) => setNoticeTarget(e.target.value)}
                >
                  <option value="All">All Workforce</option>
                  <option value="Manager">Managers Only</option>
                  <option value="Employee">Standard Employees Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowNoticeModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loadingAction}
                >
                  {loadingAction ? 'Publishing...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
