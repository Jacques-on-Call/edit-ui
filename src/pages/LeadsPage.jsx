// easy-seo/src/pages/LeadsPage.jsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { fetchJson } from '../lib/fetchJson';

export function LeadsPage() {
  const { selectedRepo } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeads = async () => {
      if (!selectedRepo) return;

      setLoading(true);
      setError(null);

      try {
        const repoName = selectedRepo.full_name;
        const data = await fetchJson(`/api/leads?repo=${repoName}`);
        setLeads(data);
      } catch (err) {
        setError('Failed to load leads.');
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [selectedRepo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="ml-3">Loading Leads...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 pt-24">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">Lead Dashboard</h1>
      {leads.length === 0 ? (
        <p className="text-gray-400">You haven't received any leads yet.</p>
      ) : (
        <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full text-white">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(lead.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(JSON.parse(lead.data), null, 2)}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
