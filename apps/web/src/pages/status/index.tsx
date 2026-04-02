import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, Clock, Database, Server, Globe } from 'lucide-react';
import { Button } from '@/components/ui';

interface ServiceCheck {
  status: 'ok' | 'error';
  latencyMs: number;
  error?: string;
}

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: Record<string, ServiceCheck>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const serviceIcons: Record<string, typeof Database> = {
  database: Database,
  auth: Server,
};

const serviceLabels: Record<string, string> = {
  database: 'Database (PostgreSQL)',
  auth: 'Authentication',
};

const StatusBadge = ({ status }: { status: 'ok' | 'error' | 'checking' }) => {
  if (status === 'checking') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Checking
      </span>
    );
  }
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
        <CheckCircle className="h-3 w-3" />
        Operational
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
      <XCircle className="h-3 w-3" />
      Error
    </span>
  );
};

export const StatusPage = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [webLatency, setWebLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);

    // Check web app (it's already loaded if you're seeing this)
    const webStart = Date.now();
    setWebLatency(Date.now() - webStart);

    // Check API
    const apiStart = Date.now();
    try {
      const res = await fetch(`${API_URL}/health/detailed`);
      setApiLatency(Date.now() - apiStart);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        setApiReachable(true);
      } else {
        setApiReachable(false);
        setHealth(null);
      }
    } catch {
      setApiLatency(Date.now() - apiStart);
      setApiReachable(false);
      setHealth(null);
    }

    setLastChecked(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const overallStatus =
    apiReachable === null ? 'checking' : apiReachable && health?.status === 'ok' ? 'ok' : 'error';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground">System Status</h1>
          <p className="text-muted-foreground mt-2">
            Current operational status of Fitnassist services
          </p>
        </div>

        {/* Overall Status */}
        <div
          className={`rounded-lg border p-6 mb-8 text-center ${
            overallStatus === 'ok'
              ? 'border-green-500/20 bg-green-500/5'
              : overallStatus === 'error'
                ? 'border-red-500/20 bg-red-500/5'
                : 'border-border'
          }`}
        >
          {overallStatus === 'checking' ? (
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          ) : overallStatus === 'ok' ? (
            <>
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              <p className="text-lg font-semibold text-green-500 mt-2">All Systems Operational</p>
            </>
          ) : (
            <>
              <XCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-lg font-semibold text-red-500 mt-2">Service Degradation</p>
            </>
          )}
        </div>

        {/* Services */}
        <div className="space-y-3">
          {/* Web App */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Web Application</p>
                {webLatency !== null && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {webLatency}ms
                  </p>
                )}
              </div>
            </div>
            <StatusBadge status="ok" />
          </div>

          {/* API */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">API Server</p>
                {apiLatency !== null && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {apiLatency}ms
                    {health?.uptime != null && (
                      <span> · Uptime: {formatUptime(health.uptime)}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <StatusBadge
              status={apiReachable === null ? 'checking' : apiReachable ? 'ok' : 'error'}
            />
          </div>

          {/* Individual service checks */}
          {health?.checks &&
            Object.entries(health.checks).map(([key, check]) => {
              const Icon = serviceIcons[key] || Server;
              const label = serviceLabels[key] || key;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {check.latencyMs}ms
                        {check.error && <span className="text-red-400 ml-2">{check.error}</span>}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={check.status} />
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
          <p>{lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Checking...'}</p>
          <Button variant="ghost" size="sm" onClick={checkStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
};

export default StatusPage;
