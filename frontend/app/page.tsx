'use client';

import { useState, useEffect } from 'react';
import { isLoggedIn } from './domains/auth/auth';
import { getNotifications } from './domains/notifications/api';
import AuthForm from './domains/auth/AuthForm';
import Dashboard from './domains/notes/Dashboard';
import Feed from './domains/feed/Feed';
import Profile from './domains/profile/Profile';
import Settings from './domains/settings/Settings';
import NotificationBell from './domains/notifications/NotificationBell';
import Sidebar from './shared/Sidebar';
import ToastContainer from './shared/Toast';
import FloatingDoodles from './shared/FloatingDoodles';

type Page = 'feed' | 'my-notes' | 'profile' | 'settings';

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('feed');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setReady(true);
    // Restore theme
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    loadNotifCount();
    const interval = setInterval(loadNotifCount, 30000);
    return () => clearInterval(interval);
  }, [authenticated]);

  async function loadNotifCount() {
    try {
      const data = await getNotifications();
      setUnreadNotifs(data.unreadCount);
    } catch { /* silent */ }
  }

  function handleNewNote() {
    setCurrentPage('my-notes');
    setShowNewNote(true);
  }

  if (!ready) return null;

  if (!authenticated) {
    return (
      <>
        <ToastContainer />
        <AuthForm onLogin={() => setAuthenticated(true)} />
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <FloatingDoodles />
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => { setCurrentPage(page); setShowNewNote(false); }}
        onLogout={() => setAuthenticated(false)}
        onNewNote={handleNewNote}
        unreadNotifs={unreadNotifs}
        onToggleNotifs={() => setShowNotifs(!showNotifs)}
      />

      {/* Main content — offset by sidebar width */}
      <div className="ml-0 md:ml-[60px] pt-14 md:pt-0 min-h-screen transition-all">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
          {/* Floating notification panel */}
          {showNotifs && (
            <div className="fixed top-16 md:top-4 right-4 z-50">
              <NotificationBell autoOpen onClose={() => setShowNotifs(false)} />
            </div>
          )}

          {currentPage === 'feed' && <Feed />}
          {currentPage === 'my-notes' && (
            <Dashboard
              onLogout={() => setAuthenticated(false)}
              forceNewNote={showNewNote}
              onNewNoteShown={() => setShowNewNote(false)}
            />
          )}
          {currentPage === 'profile' && <Profile />}
          {currentPage === 'settings' && <Settings />}
        </main>
      </div>
    </>
  );
}
