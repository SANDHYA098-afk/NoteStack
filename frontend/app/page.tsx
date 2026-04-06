'use client';

import { useState, useEffect } from 'react';
import { isLoggedIn } from './lib/auth';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import ToastContainer from './components/Toast';

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <>
      <ToastContainer />
      {authenticated ? (
        <Dashboard onLogout={() => setAuthenticated(false)} />
      ) : (
        <AuthForm onLogin={() => setAuthenticated(true)} />
      )}
    </>
  );
}
