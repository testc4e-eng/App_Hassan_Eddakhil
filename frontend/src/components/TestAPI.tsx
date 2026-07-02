import { useState } from 'react';

interface TestDbResponse {
  success: boolean;
  message?: string;
  time?: string;
  error?: string;
}

export function TestAPI() {
  const [status, setStatus] = useState<string>(''); 
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('http://localhost:5000/api/v1/hydro/test-db');
      const data: TestDbResponse = await response.json(); // ✅ Typage correct

      if (data.success) {
        setStatus(`✅ Connexion OK : ${data.time}`);
      } else {
        setStatus(`❌ Erreur API : ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      // ici on peut faire type guard pour éviter 'any'
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setStatus(`❌ API Test Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white shadow">
      <button
        onClick={testConnection}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        disabled={loading}
      >
        {loading ? 'Test en cours...' : 'Tester API'}
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
