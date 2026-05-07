// AppLayout - 页面布局包装
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
