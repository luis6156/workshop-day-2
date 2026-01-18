import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import './WebSocketDemo.css';

interface WebSocketDemoProps {
  apiUrl: string;
  onConnectionChange: (connected: boolean) => void;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  type: 'sent' | 'received';
}

function WebSocketDemo({ apiUrl, onConnectionChange }: WebSocketDemoProps) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const socket = io(apiUrl, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      onConnectionChange(true);
      toast.success('WebSocket connected');
      
      addMessage({
        id: Date.now().toString(),
        text: 'WebSocket connection established',
        timestamp: new Date().toISOString(),
        type: 'received',
      });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      onConnectionChange(false);
      toast.warning('WebSocket disconnected');
    });

    socket.on('connected', (data) => {
      addMessage({
        id: Date.now().toString(),
        text: `Server: ${data.message}`,
        timestamp: data.timestamp,
        type: 'received',
      });
    });

    socket.on('notification', (notification) => {
      addMessage({
        id: notification.id,
        text: `📬 ${notification.type.toUpperCase()}: ${notification.message}`,
        timestamp: notification.timestamp,
        type: 'received',
      });
    });

    socket.on('pong', (data) => {
      addMessage({
        id: Date.now().toString(),
        text: `🏓 Pong received`,
        timestamp: data.timestamp,
        type: 'received',
      });
    });

    socket.on('message-ack', (data) => {
      addMessage({
        id: Date.now().toString(),
        text: `✅ Message acknowledged`,
        timestamp: data.timestamp,
        type: 'received',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl, onConnectionChange]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('message', inputMessage);
    
    addMessage({
      id: Date.now().toString(),
      text: inputMessage,
      timestamp: new Date().toISOString(),
      type: 'sent',
    });

    setInputMessage('');
  };

  const sendPing = () => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('ping');
    
    addMessage({
      id: Date.now().toString(),
      text: '🏓 Ping sent',
      timestamp: new Date().toISOString(),
      type: 'sent',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="websocket-demo">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet...</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.type}`}>
              <div className="message-text">{msg.text}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button onClick={sendMessage} disabled={!connected || !inputMessage.trim()}>
          Send
        </button>
        <button onClick={sendPing} disabled={!connected}>
          Ping
        </button>
      </div>

      <div className="stats">
        {messages.length} message{messages.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default WebSocketDemo;
