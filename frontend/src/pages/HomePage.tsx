import React from 'react';
import { CheckCircle2, Server, Globe, Cpu, RefreshCw, AlertCircle } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';
import { Button } from '@/components/ui/Button';

export const HomePage: React.FC = () => {
  const { data: health, loading, error, refetch } = useHealth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
            <CheckCircle2 className="h-6 w-6 text-slate-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Brick 1: Foundation Operational
            </h1>
            <p className="text-sm text-slate-500">
              Clean modular architecture initialized and verified.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <Globe className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-500">Frontend</div>
              <div className="text-sm font-medium text-slate-800">React + Vite + TS</div>
              <div className="text-xs text-slate-400">Tailwind + Router</div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <Server className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-500">Backend</div>
              <div className="text-sm font-medium text-slate-800">FastAPI</div>
              <div className="text-xs text-slate-400">Pydantic v2 + Uvicorn</div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <Cpu className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-500">Database Ready</div>
              <div className="text-sm font-medium text-slate-800">SQLAlchemy + Alembic</div>
              <div className="text-xs text-slate-400">PostgreSQL + pgvector</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Backend Health Communication
          </h2>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="flex items-center space-x-2 text-xs py-1.5"
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Check Status</span>
          </Button>
        </div>

        {loading && (
          <div className="flex items-center space-x-2 text-sm text-slate-500 py-3">
            <RefreshCw className="h-4 w-4 animate-spin text-slate-600" />
            <span>Connecting to backend (/health)...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-md text-red-900 text-sm">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-900">Backend Offline or Not Started</div>
              <p className="text-xs text-red-700 mt-1">
                Start the backend server with <code className="bg-white px-1.5 py-0.5 rounded border border-red-200 font-mono text-red-900">uvicorn app.main:app --reload</code> to connect.
              </p>
              <div className="text-xs text-red-600 mt-1 font-mono">{error}</div>
            </div>
          </div>
        )}

        {!loading && health && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900">
            <div className="flex items-center space-x-2 font-semibold text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-900">Backend Connected: {health.status.toUpperCase()}</span>
            </div>
            <div className="text-xs text-emerald-800 mt-2 space-y-1">
              <div>Project: <strong className="text-emerald-950 font-medium">{health.project}</strong></div>
              <div>Environment: <strong className="text-emerald-950 font-medium">{health.environment}</strong></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Brick 2: Modular Route Verification
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Click below to verify the decoupled layout and routing branches without authentication or business logic:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="/student"
            className="flex items-center justify-between p-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-800"
          >
            <span>/student &rarr;</span>
            <span className="text-[10px] text-slate-500">StudentLayout</span>
          </a>
          <a
            href="/parent"
            className="flex items-center justify-between p-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-800"
          >
            <span>/parent &rarr;</span>
            <span className="text-[10px] text-slate-500">ParentLayout</span>
          </a>
          <a
            href="/admin"
            className="flex items-center justify-between p-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-800"
          >
            <span>/admin &rarr;</span>
            <span className="text-[10px] text-slate-500">AdminLayout</span>
          </a>
        </div>
      </div>
    </div>
  );
};
