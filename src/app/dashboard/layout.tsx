'use client';

import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen" style={{ background: '#EEF2FF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            background: 'linear-gradient(160deg, #EEF2FF 0%, #F0F4FF 40%, #EDF0FF 100%)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
