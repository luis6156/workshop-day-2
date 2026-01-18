import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import './SSEDemo.css';

interface SSEDemoProps {
  apiUrl: string;
  onConnectionChange: (connected: boolean) => void;
}

interface SSEEvent {
  id: string;
  data: any;
  timestamp: string;
}

function SSEDemo({ apiUrl, onConnectionChange }: SSEDemoProps) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  const connect = () => {
    if (eventSourceRef.current) {
      return;
    }

    const eventSource = new EventSource(`${apiUrl}/api/sse/notifications`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      onConnectionChange(true);
      toast.success('SSE connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        addEvent({
          id: data.id || Date.now().toString(),
          data,
          timestamp: data.timestamp || new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      onConnectionChange(false);
      toast.error('SSE connection error');
      disconnect();
    };
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
      onConnectionChange(false);
      toast.info('SSE disconnected');
    }
  };

  const addEvent = (event: SSEEvent) => {
    setEvents((prev) => [...prev, event]);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const formatData = (data: any) => {
    if (typeof data === 'string') {
      return data;
    }
    
    if (data.message) {
      return `${data.type ? `[${data.type.toUpperCase()}] ` : ''}${data.message}`;
    }
    
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="sse-demo">
      <div className="sse-controls">
        <button onClick={connect} disabled={connected}>
          {connected ? '✅ Connected' : '🔌 Connect'}
        </button>
        <button onClick={disconnect} disabled={!connected}>
          🔌 Disconnect
        </button>
        <button onClick={clearEvents}>
          🗑️ Clear
        </button>
        <label className="auto-scroll-toggle">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll
        </label>
      </div>

      <div className="events-container">
        {events.length === 0 ? (
          <div className="no-events">
            {connected ? 'Waiting for events...' : 'Click Connect to start receiving events'}
          </div>
        ) : (
          events.map((event, index) => (
            <div key={`${event.id}-${index}`} className="sse-event">
              <div className="event-header">
                <span className="event-id">#{index + 1}</span>
                <span className="event-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="event-data">
                {formatData(event.data)}
              </div>
            </div>
          ))
        )}
        <div ref={eventsEndRef} />
      </div>

      <div className="stats">
        {events.length} event{events.length !== 1 ? 's' : ''} received
      </div>
    </div>
  );
}

export default SSEDemo;
