// Modal 组件
import { useEffect } from 'react';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = '500px',
  className = ''
}) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${className}`}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Drawer 组件
export function Drawer({
  open,
  onClose,
  title,
  children,
  placement = 'right',
  width = '400px'
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className={`drawer-content drawer-${placement}`}
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <h3>{title}</h3>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>
        <div className="drawer-body">
          {children}
        </div>
      </div>
    </div>
  );
}
