import React, { createContext, useContext, useState, useEffect } from 'react';

const AUTH_KEY = 'pump_pdm_auth';
const CLIENTS_KEY = 'pump_pdm_clients';
const DEMO_ENTRIES_KEY = 'pump_pdm_demo_entries';

function loadStored(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('AuthContext save failed', e);
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadStored(AUTH_KEY, null));
  const [clients, setClients] = useState(() => loadStored(CLIENTS_KEY, []));
  const [demoEntries, setDemoEntries] = useState(() => loadStored(DEMO_ENTRIES_KEY, []));

  useEffect(() => {
    saveStored(AUTH_KEY, user);
  }, [user]);

  useEffect(() => {
    saveStored(CLIENTS_KEY, clients);
  }, [clients]);

  useEffect(() => {
    saveStored(DEMO_ENTRIES_KEY, demoEntries);
  }, [demoEntries]);

  const isAdmin = user?.role === 'admin';

  const login = (email, password) => {
    const e = (email || '').trim().toLowerCase();
    const p = password || '';
    // Master admin (matches backend admins collection): ranjith.c96me@gmail.com / 12345678
    if (e === 'ranjith.c96me@gmail.com' && p === '12345678') {
      const u = { email: e, name: 'Master Admin', role: 'admin' };
      setUser(u);
      return { ok: true, role: 'admin' };
    }
    // Client login: match stored client by email; require approved demo
    const client = clients.find((c) => (c.email || '').toLowerCase() === e);
    if (client && client.password === p) {
      const entry = demoEntries.find(
        (d) => d.clientId === client.id || (d.email || '').toLowerCase() === e
      );
      const status = (entry?.status || 'pending').toLowerCase();
      if (status !== 'approved') {
        if (status === 'rejected') {
          return { ok: false, error: 'Your demo request was rejected. Please contact support.' };
        }
        return { ok: false, error: 'Your demo request is pending approval. Please wait for admin to approve.' };
      }
      const u = { email: client.email, name: client.companyName || client.name, role: 'client', clientId: client.id };
      setUser(u);
      return { ok: true, role: 'client' };
    }
    return { ok: false, error: 'Invalid email or password.' };
  };

  const registerDemo = (data) => {
    const id = `demo-${Date.now()}`;
    const clientId = `client-${Date.now()}`;
    const entry = {
      id,
      clientId,
      name: data.name,
      companyName: data.companyName,
      email: data.email,
      numberOfPumps: data.numberOfPumps,
      phone: data.phone,
      companyLogoPreview: data.companyLogoPreview,
      companyLogoFileName: data.companyLogoFileName,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    const client = {
      id: clientId,
      name: data.name,
      companyName: data.companyName,
      email: data.email,
      password: data.password,
      numberOfPumps: data.numberOfPumps,
      phone: data.phone,
      companyLogoPreview: data.companyLogoPreview,
      companyLogoFileName: data.companyLogoFileName,
      plan: 'Demo (30 days)',
      createdAt: new Date().toISOString(),
    };
    setDemoEntries((prev) => [entry, ...prev]);
    setClients((prev) => [client, ...prev]);
    setUser({ email: client.email, name: client.companyName || client.name, role: 'client', clientId });
    return { ok: true, role: 'client' };
  };

  const logout = () => setUser(null);

  const updateDemoEntryStatus = (entryId, status) => {
    const allowed = ['approved', 'rejected', 'pending'];
    if (!allowed.includes(status)) return;
    setDemoEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, status, updatedAt: new Date().toISOString() } : e))
    );
  };

  const getCurrentClient = () => {
    if (!user?.clientId || !clients?.length) return null;
    return clients.find((c) => c.id === user.clientId) || null;
  };

  const updateClientPlan = (clientId, planName) => {
    if (!clientId || !planName) return;
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, plan: planName, planUpdatedAt: new Date().toISOString() } : c))
    );
  };

  /** After backend register-demo succeeds: store user, client, and demo entry so plan/pumps work. */
  const completeRegistrationFromBackend = (response, formData) => {
    if (!response?.ok || !response?.user || !response?.clientId || !response?.demoId) return;
    const { user, clientId, demoId } = response;
    const now = new Date().toISOString();
    const client = {
      id: clientId,
      name: formData.name || '',
      companyName: formData.companyName || '',
      email: (formData.email || '').trim().toLowerCase(),
      password: formData.password || '',
      numberOfPumps: formData.numberOfPumps ?? 0,
      phone: formData.phone || '',
      companyLogoPreview: formData.companyLogoPreview,
      companyLogoFileName: formData.companyLogoFileName,
      plan: 'Free',
      createdAt: now,
    };
    const demoEntry = {
      id: demoId,
      clientId,
      name: formData.name || '',
      companyName: formData.companyName || '',
      email: (formData.email || '').trim().toLowerCase(),
      numberOfPumps: formData.numberOfPumps ?? 0,
      phone: formData.phone || '',
      companyLogoPreview: formData.companyLogoPreview,
      companyLogoFileName: formData.companyLogoFileName,
      createdAt: now,
      status: 'pending',
    };
    setClients((prev) => [client, ...prev]);
    setDemoEntries((prev) => [demoEntry, ...prev]);
    setUser(user);
  };

  const value = {
    user,
    isAdmin,
    isAuthenticated: !!user,
    login,
    registerDemo,
    logout,
    clients,
    demoEntries,
    setClients,
    setDemoEntries,
    updateDemoEntryStatus,
    getCurrentClient,
    updateClientPlan,
    completeRegistrationFromBackend,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
