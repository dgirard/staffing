import { useState, useEffect } from 'react';

function App() {
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8787/')
      .then(res => res.json())
      .then(data => {
        setApiStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('API Error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏢 Staffing ESN
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            CHANTIER_00 - Setup Infrastructure
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              ✅ Status
            </h2>

            <div className="space-y-3 text-left">
              <StatusItem
                label="Frontend"
                status="running"
                detail="React 18 + Vite + Tailwind CSS"
              />
              <StatusItem
                label="API"
                status={apiStatus ? 'connected' : loading ? 'checking' : 'disconnected'}
                detail={apiStatus ? apiStatus.message : 'Vérification...'}
              />
            </div>
          </div>

          {apiStatus && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✅ Infrastructure fonctionnelle !
              </p>
              <p className="text-green-600 text-sm mt-1">
                Version API: {apiStatus.version}
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Prêt pour CHANTIER_01 : Auth JWT + RBAC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatusItemProps {
  label: string;
  status: 'running' | 'connected' | 'checking' | 'disconnected';
  detail: string;
}

function StatusItem({ label, status, detail }: StatusItemProps) {
  const statusColors = {
    running: 'bg-green-100 text-green-800',
    connected: 'bg-green-100 text-green-800',
    checking: 'bg-yellow-100 text-yellow-800',
    disconnected: 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    running: '✅',
    connected: '✅',
    checking: '🔄',
    disconnected: '❌',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{detail}</p>
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
        {statusIcons[status]} {status}
      </div>
    </div>
  );
}

export default App;
