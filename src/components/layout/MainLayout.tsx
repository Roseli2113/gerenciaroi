import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSaleNotification } from '@/hooks/useSaleNotification';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  headerAction?: ReactNode;
}

export function MainLayout({ children, title, headerAction }: MainLayoutProps) {
  // Initialize sale notification listener globally
  useSaleNotification();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} headerAction={headerAction} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
