import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';

function OrganizationSettings() {
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null);

  const fetchOrg = async () => {
    try {
      const res = await API.get('/organizations/me');
      setOrg(res.data.data);
    } catch {
      toast.error('Failed to load organization');
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await API.get('/organizations/members');
      setMembers(res.data.data || []);
    } catch {
      /* ignore */
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await API.get('/organizations/api-keys');
      setApiKeys(res.data.data || []);
    } catch {/* ignore */}
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchOrg(), fetchMembers(), fetchApiKeys()]);
      setLoading(false);
    })();
  }, []);

  const addMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    try {
      await API.post('/organizations/members', { email: newMemberEmail });
      setNewMemberEmail('');
      fetchMembers();
      toast.success('Member added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await API.delete(`/organizations/members/${userId}`);
      fetchMembers();
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const createKey = async (e) => {
    e.preventDefault();
    if (!newKeyName) return;
    try {
      const res = await API.post('/organizations/api-keys', { name: newKeyName });
      setCreatedKey(res.data.apiKey);
      setNewKeyName('');
      fetchApiKeys();
      toast.success('API key created (copy now!)');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const revokeKey = async (keyId) => {
    if (!window.confirm('Revoke this API key?')) return;
    try {
      await API.post(`/organizations/api-keys/${encodeURIComponent(keyId)}/revoke`);
      fetchApiKeys();
      toast.success('Key revoked');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="p-6">Loading organization...</div>;
  if (!org) return <div className="p-6 text-red-500">Organization not found</div>;

  const usagePct = org.usage && org.limits ? Math.min(100, Math.round((org.usage.logCount / org.limits.logsPerMonth) * 100)) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-10">
      <section>
        <h1 className="text-2xl font-bold mb-2">Organization</h1>
        <p className="text-sm text-gray-600">Name: <span className="font-medium">{org.name}</span></p>
        <p className="text-sm text-gray-600">Plan: <span className="font-medium capitalize">{org.plan}</span></p>
        <p className="text-sm text-gray-600">Monthly Logs: {org.usage?.logCount || 0} / {org.limits?.logsPerMonth}</p>
        <div className="w-full bg-gray-200 h-3 rounded mt-2">
          <div className="h-3 rounded bg-blue-500 transition-all" style={{ width: usagePct + '%' }} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Members</h2>
        <form onSubmit={addMember} className="flex gap-2 mb-4 flex-wrap">
          <input value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="user@example.com" className="border p-2 flex-1 min-w-[220px]" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Add Member</button>
        </form>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.user._id} className="flex justify-between items-center border rounded p-2 bg-white">
              <div>
                <span className="font-medium">{m.user.name}</span> <span className="text-xs text-gray-500">{m.user.email}</span> <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100">{m.role}</span>
              </div>
              {m.role !== 'owner' && (
                <button onClick={() => removeMember(m.user._id)} className="text-red-600 text-sm hover:underline">Remove</button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">API Keys</h2>
        <form onSubmit={createKey} className="flex gap-2 mb-4 flex-wrap">
          <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key Name" className="border p-2 flex-1 min-w-[200px]" />
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Create Key</button>
        </form>
        {createdKey && (
          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-sm mb-4">
            <p className="font-medium">New Key (copy now):</p>
            <code className="break-all text-xs">{createdKey}</code>
          </div>
        )}
        <ul className="space-y-2">
          {apiKeys.map((k) => (
            <li key={k.keyId || k.name} className="flex justify-between items-center border rounded p-2 bg-white">
              <div>
                <span className="font-medium">{k.name}</span>
                {k.keyId && (
                  <span className="ml-2 text-xs text-gray-400">id: {k.keyId}</span>
                )}
                <span className="ml-2 text-xs text-gray-500">{k.revoked ? 'revoked' : 'active'}</span>
                {k.lastUsedAt && (
                  <span className="ml-2 text-xs text-gray-400">last used {new Date(k.lastUsedAt).toLocaleString()}</span>
                )}
              </div>
              {!k.revoked && (
                <button onClick={() => revokeKey(k.keyId)} className="text-red-600 text-sm hover:underline">Revoke</button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default OrganizationSettings;
