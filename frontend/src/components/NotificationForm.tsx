import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './NotificationForm.css';

interface NotificationFormProps {
  apiUrl: string;
}

function NotificationForm({ apiUrl }: NotificationFormProps) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/api/notifications`, {
        message,
        type,
        metadata: {
          source: 'frontend',
          timestamp: new Date().toISOString(),
        },
      });

      if (response.data.success) {
        toast.success('Notification sent!');
        setMessage('');
      }
    } catch (error) {
      toast.error('Failed to send notification');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="notification-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your notification message..."
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="type">Type</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          disabled={loading}
        >
          <option value="info">ℹ️ Info</option>
          <option value="success">✅ Success</option>
          <option value="warning">⚠️ Warning</option>
          <option value="error">❌ Error</option>
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? '📤 Sending...' : '📤 Send Notification'}
      </button>
    </form>
  );
}

export default NotificationForm;
