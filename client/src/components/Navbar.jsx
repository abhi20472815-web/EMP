import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Sun, Moon } from 'lucide-react';

const Navbar = ({ activeTab, theme, toggleTheme }) => {
  const { user, authFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem('read_notices');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const dropdownRef = useRef(null);

  // Fetch notice announcements from backend
  const fetchNotices = async () => {
    if (!user) return;
    try {
      const res = await authFetch('/notices');
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Error fetching notifications in Navbar:', error);
    }
  };

  useEffect(() => {
    fetchNotices();
    // Poll every 30 seconds to fetch live notices in real-time
    const interval = setInterval(fetchNotices, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click away listener to close dropdown when clicking outside
  useEffect(() => {
    const clickAway = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickAway);
    return () => document.removeEventListener('mousedown', clickAway);
  }, []);

  const unreadCount = Array.isArray(notifications) && Array.isArray(readIds)
    ? notifications.filter(n => n && !readIds.includes(n._id)).length
    : 0;

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
    // Automatically mark all as read when opening the drawer
    if (!isOpen && unreadCount > 0) {
      const allIds = notifications.map(n => n._id);
      localStorage.setItem('read_notices', JSON.stringify(allIds));
      setReadIds(allIds);
    }
  };

  const markAllRead = (e) => {
    e.stopPropagation();
    const allIds = notifications.map(n => n._id);
    localStorage.setItem('read_notices', JSON.stringify(allIds));
    setReadIds(allIds);
  };

  // Map tab IDs to display titles
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'employees':
        return 'Employee Directory';
      case 'leaves':
        return 'Leave Planner';
      case 'performance':
        return 'Performance Audits';
      default:
        return 'Employee Portal';
    }
  };

  // Format current date
  const formatDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  return (
    <nav className="navbar">
      <div>
        <h2 className="nav-title" style={{ fontFamily: 'var(--font-heading)' }}>
          {getTitle()}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
          {formatDate()}
        </p>
      </div>

      <div className="nav-actions">
        {/* Interactive Notification Icon Wrapper */}
        <div className="notification-container" ref={dropdownRef}>
          <button 
            className="btn-icon-only" 
            title="Notifications"
            onClick={toggleDropdown}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge" />}
          </button>

          {isOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notices Bulletin ({notifications.length})</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="btn-text">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    No new notices. You are up to date!
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isUnread = !readIds.includes(n._id);
                    return (
                      <div 
                        key={n._id} 
                        className={`notification-item ${isUnread ? 'unread' : 'read'}`}
                      >
                        <div className="notification-item-title">{n.title}</div>
                        <div className="notification-item-content">{n.content}</div>
                        <div className="notification-item-meta">
                          <span>{n.authorId?.name || 'HR Team'}</span>
                          <span>
                            {new Date(n.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Theme Toggle */}
        <button 
          className="btn-icon-only" 
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Welcome, {user?.name ? user.name.split(' ')[0] : 'User'}!
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 500 }}>
              {user.designation}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
