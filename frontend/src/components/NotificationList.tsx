import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './NotificationList.css';

interface NotificationListProps {
  apiUrl: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  metadata?: Record<string, any>;
}

function NotificationList({ apiUrl }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get(`${apiUrl}/api/notifications`);
      
      if (response.data.success) {
        setNotifications(response.data.data);
        setLastFetch(new Date());
      }
    } catch (error) {
      toast.error('Failed to fetch notifications');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return '#3b82f6';
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="notification-list">
      <div className="list-header">
        <div className="list-info">
          {lastFetch && (
            <span className="last-fetch">
              Last updated: {lastFetch.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button onClick={fetchNotifications} disabled={loading}>
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="notifications-grid">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            {loading ? 'Loading notifications...' : 'No notifications yet. Create one above!'}
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="notification-card"
              style={{
                borderLeftColor: getTypeColor(notification.type),
              }}
            >
              <div className="notification-header">
                <span className="notification-icon">
                  {getTypeIcon(notification.type)}
                </span>
                <span className="notification-type">{notification.type.toUpperCase()}</span>
                <span className="notification-time">
                  {new Date(notification.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="notification-message">{notification.message}</div>
              {notification.metadata && (
                <div className="notification-metadata">
                  <details>
                    <summary>Metadata</summary>
                    <pre>{JSON.stringify(notification.metadata, null, 2)}</pre>
                  </details>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationList;
