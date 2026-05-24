import { type ReactNode } from 'react';
import './Layout.css';

interface LayoutProps {
  clockPanel: ReactNode;
  calendarPanel: ReactNode;
}

/**
 * Main two-panel layout.
 * Landscape: Clock left, Calendar right.
 * Portrait: Clock top, Calendar bottom.
 */
export function Layout({ clockPanel, calendarPanel }: LayoutProps) {
  return (
    <div className="app-container">
      <main className="layout" id="deskpad-layout">
        <section className="layout__clock-panel" aria-label="Clock">
          {clockPanel}
        </section>
        <section className="layout__calendar-panel" aria-label="Calendar">
          {calendarPanel}
        </section>
      </main>
    </div>
  );
}
