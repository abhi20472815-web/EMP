import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CalendarRange, 
  BarChart3, 
  Megaphone, 
  LogOut,
  ShieldAlert,
  Clock
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Define navigation items based on role
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: Users,
      roles: ['admin', 'manager', 'employee'], // Employees can view directory
    },
    {
      id: 'leaves',
      label: 'Leaves',
      icon: CalendarRange,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: BarChart3,
      roles: ['admin', 'manager', 'employee'],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: Clock,
      roles: ['admin', 'manager', 'employee'],
    },
  ];

  // Helper to extract initials for avatar
  const getInitials = (name) => {
    if (!name) return 'EE';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleItemSelect = (tabId) => {
    setActiveTab(tabId);
    if (setIsOpen) setIsOpen(false); // Close sidebar on mobile upon tap
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <ShieldAlert size={20} color="white" />
        </div>
        <div className="logo-text">AURA EMS</div>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          // Check role permission
          if (!item.roles.includes(user.role)) return null;

          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <li key={item.id}>
              <button
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => handleItemSelect(item.id)}
                style={{ 
                  width: '100%', 
                  background: 'none', 
                  border: 'none', 
                  textAlign: 'left',
                  cursor: 'pointer' 
                }}
              >
                <IconComponent className="sidebar-item-icon" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Quick Logout Button */}
      <ul className="sidebar-menu" style={{ marginTop: '1.5rem' }}>
        <li>
          <button
            className="sidebar-item"
            onClick={logout}
            style={{ 
              width: '100%', 
              background: 'none', 
              border: 'none', 
              textAlign: 'left',
              cursor: 'pointer',
              color: 'var(--accent-danger)'
            }}
          >
            <LogOut className="sidebar-item-icon" />
            <span>Logout</span>
          </button>
        </li>
      </ul>

      <div className="sidebar-user">
        <div className="user-avatar">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name} 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <div className="user-details">
          <span className="user-name" title={user.name}>{user.name}</span>
          <span className="user-role">{user.role}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
