import './StatusIndicator.css';

interface StatusIndicatorProps {
  label: string;
  connected: boolean;
}

function StatusIndicator({ label, connected }: StatusIndicatorProps) {
  return (
    <div className="status-indicator">
      <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
      <span className="status-label">{label}</span>
    </div>
  );
}

export default StatusIndicator;
