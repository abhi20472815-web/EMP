import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  UserCheck, 
  FileSpreadsheet, 
  RefreshCw, 
  ChevronRight,
  TrendingUp,
  LogOut
} from 'lucide-react';

const Attendance = () => {
  const { user, authFetch } = useAuth();
  
  // States
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [teamStatus, setTeamStatus] = useState([]);
  const [reportData, setReportData] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tabs for Manager / Admin
  const [activeSubTab, setActiveSubTab] = useState('my-attendance'); // 'my-attendance', 'shift-scheduling', 'monthly-report'

  // Update clock in real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClockTime = (date) => {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatTime = (dateVal) => {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch today's status
      const statusRes = await authFetch('/attendance/status');
      if (statusRes.success) {
        setTodayStatus(statusRes.data);
      }

      // 2. Fetch history
      const historyRes = await authFetch('/attendance/my-history');
      if (historyRes.success) {
        setHistory(historyRes.data);
      }

      // 3. Fetch Manager / Admin details
      if (user && (user.role === 'manager' || user.role === 'admin')) {
        const teamRes = await authFetch('/attendance/team');
        if (teamRes.success) {
          setTeamStatus(teamRes.data);
        }

        const reportRes = await authFetch('/attendance/report');
        if (reportRes.success) {
          setReportData(reportRes.data);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [user]);

  // Handle Check-in Action
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch('/attendance/checkin', {
        method: 'POST',
      });
      if (res.success) {
        setTodayStatus(res.data);
        // Refresh logs
        fetchAttendanceData();
      } else {
        alert(res.error || 'Failed to check in.');
      }
    } catch (error) {
      alert('Check-in error: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Check-out Action
  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch('/attendance/checkout', {
        method: 'POST',
      });
      if (res.success) {
        setTodayStatus(res.data);
        // Refresh logs
        fetchAttendanceData();
      } else {
        alert(res.error || 'Failed to check out.');
      }
    } catch (error) {
      alert('Check-out error: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Update employee shift settings
  const handleShiftChange = async (employeeId, shiftName) => {
    try {
      const res = await authFetch(`/attendance/shift/${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify({ shiftName }),
      });
      if (res.success) {
        // Refresh data tables
        fetchAttendanceData();
      } else {
        alert(res.error || 'Failed to schedule shift.');
      }
    } catch (error) {
      alert('Shift update error: ' + error.message);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Present':
        return 'badge-success';
      case 'Late':
        return 'badge-warning';
      case 'Half-Day':
        return 'badge-info';
      case 'Absent':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="dashboard-content" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Role-Based Sub-Tab Navigation Header (frosted glass) */}
      {user && (user.role === 'manager' || user.role === 'admin') && (
        <div className="tabs-navigation glass-panel mb-6" style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1.25rem' }}>
          <button 
            className={`btn ${activeSubTab === 'my-attendance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('my-attendance')}
          >
            <Clock size={16} />
            <span>My Attendance</span>
          </button>
          
          <button 
            className={`btn ${activeSubTab === 'shift-scheduling' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('shift-scheduling')}
          >
            <Calendar size={16} />
            <span>Shift Scheduling</span>
          </button>

          <button 
            className={`btn ${activeSubTab === 'monthly-report' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('monthly-report')}
          >
            <FileSpreadsheet size={16} />
            <span>Attendance Reports</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-color)', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading attendance services...</p>
        </div>
      ) : (
        <>
          {/* VIEW 1: MY ATTENDANCE MODULE */}
          {activeSubTab === 'my-attendance' && (
            <div className="grid-2col">
              
              {/* Punch Card Column */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                    Enterprise Punch Card
                  </span>
                  
                  {/* Digital Clock */}
                  <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: '1rem 0', fontFamily: 'monospace', color: 'var(--heading-color)', textShadow: '0 0 20px var(--accent-glow)' }}>
                    {formatClockTime(currentTime)}
                  </h1>
                  
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>

                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', display: 'inline-flex', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Assigned Shift:</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--heading-color)' }}>
                        {user?.shift?.name || 'Morning'}
                      </strong>
                    </div>
                    <div style={{ width: '1px', background: 'var(--glass-border)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Timings:</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--heading-color)' }}>
                        {user?.shift?.startTime || '09:00'} - {user?.shift?.endTime || '17:00'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  {/* Check-In / Check-Out Interactive Buttons */}
                  {!todayStatus ? (
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 0 20px rgba(16,185,129,0.3)', border: 'none' }}
                      onClick={handleCheckIn}
                      disabled={actionLoading}
                    >
                      <UserCheck size={20} />
                      <span>{actionLoading ? 'Pounding...' : 'Check In Today'}</span>
                    </button>
                  ) : !todayStatus.checkOut ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="glass-card" style={{ padding: '0.85rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <CheckCircle size={16} />
                        <span>Checked In at {formatTime(todayStatus?.checkIn)}</span>
                      </div>
                      
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 0 20px rgba(239,68,68,0.3)', border: 'none' }}
                        onClick={handleCheckOut}
                        disabled={actionLoading}
                      >
                        <LogOut size={20} />
                        <span>{actionLoading ? 'Pounding...' : 'Check Out Shift'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="glass-card" style={{ padding: '2rem 1rem', background: 'rgba(99,102,241,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                      <CheckCircle size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
                      <h4 style={{ color: 'var(--heading-color)', marginBottom: '0.5rem' }}>Shift Completed Today</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        In: {formatTime(todayStatus?.checkIn)} | Out: {formatTime(todayStatus?.checkOut)}
                      </p>
                      {todayStatus.overtimeHours > 0 && (
                        <div className="badge badge-success mt-4" style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                          <TrendingUp size={12} />
                          <span>Overtime: {todayStatus.overtimeHours}h</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Log History Column */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 className="section-title">My Punch Log History</h3>
                
                <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Shift</th>
                        <th>In / Out</th>
                        <th>Overtime</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No attendance punch records found.
                          </td>
                        </tr>
                      ) : (
                        history.map((rec) => {
                          const workedHours = rec.checkOut 
                            ? ((new Date(rec.checkOut) - new Date(rec.checkIn)) / (1000 * 60 * 60)).toFixed(1) + 'h'
                            : 'Active';

                          return (
                            <tr key={rec._id}>
                              <td>{rec.date}</td>
                              <td>{rec.shift}</td>
                              <td style={{ fontSize: '0.8rem' }}>
                                <div>In: {formatTime(rec.checkIn)}</div>
                                {rec.checkOut && (
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                    Out: {formatTime(rec.checkOut)} ({workedHours})
                                  </div>
                                )}
                              </td>
                              <td>
                                {rec.overtimeHours > 0 ? (
                                  <span style={{ color: '#10b981', fontWeight: 600 }}>+{rec.overtimeHours}h</span>
                                ) : (
                                  <span style={{ color: 'var(--text-secondary)' }}>0</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(rec.status)}`}>
                                  {rec.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: SHIFT SCHEDULING MODULE */}
          {activeSubTab === 'shift-scheduling' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 className="section-title">Team Shift Scheduling Directory</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Manage shift arrangements and view today's active punch statuses for your reporting workforce.
              </p>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Today's Status</th>
                      <th>Today's Timings</th>
                      <th>Scheduled Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStatus.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          No direct reporting employees found.
                        </td>
                      </tr>
                    ) : (
                      teamStatus.map((emp) => {
                        const today = emp.attendanceToday;
                        
                        return (
                          <tr key={emp._id}>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--heading-color)' }}>{emp.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.designation}</div>
                            </td>
                            <td>{emp.department}</td>
                            <td>
                              {today ? (
                                <span className={`badge ${getStatusBadgeClass(today.status)}`}>
                                  {today.status}
                                </span>
                              ) : (
                                <span className="badge badge-danger">Absent</span>
                              )}
                            </td>
                            <td>
                              {today ? (
                                <div style={{ fontSize: '0.8rem' }}>
                                  <div>In: {formatTime(today.checkIn)}</div>
                                  {today.checkOut && (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                      Out: {formatTime(today.checkOut)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Not punched today</span>
                              )}
                            </td>
                            <td>
                              {/* Shift selector dropdown */}
                              <select 
                                className="form-select"
                                style={{ padding: '0.4rem 0.8rem', width: 'auto', fontSize: '0.85rem' }}
                                value={emp.shift?.name || 'Morning'}
                                onChange={(e) => handleShiftChange(emp._id, e.target.value)}
                              >
                                <option value="Morning">Morning (09:00 - 17:00)</option>
                                <option value="Evening">Evening (17:00 - 01:00)</option>
                                <option value="Night">Night (01:00 - 09:00)</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: MONTHLY REPORTS MODULE */}
          {activeSubTab === 'monthly-report' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Monthly Attendance Audit Reports</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Centralized payroll and check summary metrics detailing total working days, late entries, and overtime logs.
                  </p>
                </div>
                {/* Decorative Export Icon */}
                <button 
                  className="btn btn-secondary" 
                  onClick={() => alert('Monthly report summary compiled and ready for PDF generation.')}
                  style={{ gap: '0.25rem' }}
                >
                  <FileSpreadsheet size={16} />
                  <span>Export Report</span>
                </button>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Department & Position</th>
                      <th>Shift Schedule</th>
                      <th>Present Days</th>
                      <th>Late Entries</th>
                      <th>Accumulated Overtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          No audit reports data available.
                        </td>
                      </tr>
                    ) : (
                      reportData.map((emp) => (
                        <tr key={emp._id}>
                          <td>
                            <strong style={{ color: 'var(--heading-color)' }}>{emp.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                          </td>
                          <td>
                            <div>{emp.department}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.designation}</div>
                          </td>
                          <td>
                            <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                              {emp.shift?.name || 'Morning'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{emp.presentDays} days</td>
                          <td>
                            {emp.lateDays > 0 ? (
                              <span style={{ color: '#ef4444', fontWeight: 600 }}>{emp.lateDays} times</span>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)' }}>0</span>
                            )}
                          </td>
                          <td>
                            {emp.totalOvertimeHours > 0 ? (
                              <span style={{ color: '#10b981', fontWeight: 600 }}>{emp.totalOvertimeHours} hours</span>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)' }}>0</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Attendance;
