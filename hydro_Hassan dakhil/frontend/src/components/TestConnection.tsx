import { useState, useEffect } from 'react';
import { checkHealth, getStations, getCatchments } from '../api/hydro';

export function TestConnection() {
  const [status, setStatus] = useState<string>('Testing...');
  const [stationsCount, setStationsCount] = useState<number>(0);
  const [catchmentsCount, setCatchmentsCount] = useState<number>(0);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test de santé
        const health = await checkHealth();
        setStatus(`✅ API is healthy - Database: ${health.database}`);
        
        // Test stations
        const stations = await getStations({ limit: 5 });
        setStationsCount(stations.length);
        
        // Test catchments
        const catchments = await getCatchments();
        setCatchmentsCount(catchments.length);
        
      } catch (error) {
        setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="font-bold mb-2">Test de connexion API</h3>
      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-medium">Statut:</span> {status}
        </div>
        <div className="text-sm">
          <span className="font-medium">Stations:</span> {stationsCount}
        </div>
        <div className="text-sm">
          <span className="font-medium">Bassins versants:</span> {catchmentsCount}
        </div>
        <div className="text-sm">
          <span className="font-medium">URL API:</span> {import.meta.env.VITE_API_URL || 'Not configured'}
        </div>
      </div>
    </div>
  );
}