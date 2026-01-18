import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import WebSocketDemo from './components/WebSocketDemo';
import SSEDemo from './components/SSEDemo';
import NotificationForm from './components/NotificationForm';
import NotificationList from './components/NotificationList';
import StatusIndicator from './components/StatusIndicator';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ConnectionStatus {
  websocket: boolean;
  sse: boolean;
  api: boolean;
}

function App() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    websocket: false,
    sse: false,
    api: false,
  });

  useEffect(() => {
    // Check API health
    fetch(`${API_URL}/api/health`)
      .then(() => {
        setConnectionStatus((prev) => ({ ...prev, api: true }));
        toast.success('Connected to API');
      })
      .catch(() => {
        toast.error('Failed to connect to API');
      });
  }, []);

  const updateConnectionStatus = (type: keyof ConnectionStatus, status: boolean) => {
    setConnectionStatus((prev) => ({ ...prev, [type]: status }));
  };

  return (
    <div className="app">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      <header className="app-header">
        <h1>☁️ Cloud Native Demo</h1>
        <p>WebSocket, SSE, Redis, Docker, Kubernetes, Terraform & LGTM Stack</p>
      </header>

      <div className="status-bar">
        <StatusIndicator label="API" connected={connectionStatus.api} />
        <StatusIndicator label="WebSocket" connected={connectionStatus.websocket} />
        <StatusIndicator label="SSE" connected={connectionStatus.sse} />
      </div>

      <div className="container">
        <div className="section">
          <h2>📤 Create Notification</h2>
          <NotificationForm apiUrl={API_URL} />
        </div>

        <div className="section">
          <h2>🔌 WebSocket Demo</h2>
          <WebSocketDemo
            apiUrl={API_URL}
            onConnectionChange={(connected) => updateConnectionStatus('websocket', connected)}
          />
        </div>

        <div className="section">
          <h2>📡 Server-Sent Events (SSE)</h2>
          <SSEDemo
            apiUrl={API_URL}
            onConnectionChange={(connected) => updateConnectionStatus('sse', connected)}
          />
        </div>

        <div className="section full-width">
          <h2>📋 Notification History</h2>
          <NotificationList apiUrl={API_URL} />
        </div>
      </div>

      <footer className="app-footer">
        <div className="footer-links">
          <a href={`${API_URL}/metrics`} target="_blank" rel="noopener noreferrer">
            📊 Metrics
          </a>
          <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer">
            📈 Grafana
          </a>
          <a href={`${API_URL}/api/health`} target="_blank" rel="noopener noreferrer">
            💚 Health
          </a>
        </div>
        <p>Built with React, TypeScript, Socket.io, and ❤️</p>
      </footer>
    </div>
  );
}

export default App;
