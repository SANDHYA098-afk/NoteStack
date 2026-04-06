'use client';

import { useState, useEffect } from 'react';
import { isLoggedIn } from './domains/auth/auth';
import AuthForm from './domains/auth/AuthForm';
import Dashboard from './domains/notes/Dashboard';
import ToastContainer from './shared/Toast';

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
