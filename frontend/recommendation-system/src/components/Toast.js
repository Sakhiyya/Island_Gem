import React, { useEffect } from "react";

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-notification toast-${type}`} role="alert" aria-live="assertive">
      <span>{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close notification">×</button>
    </div>
  );
}

export default Toast;
