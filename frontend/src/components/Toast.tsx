interface ToastProps {
  open: boolean;
  message: string;
  type?: 'info' | 'warning' | 'error';
}

export const Toast = ({ open, message, type = 'info' }: ToastProps) => {
  if (!open) {
    return null;
  }

  const palette =
    type === 'error'
      ? 'bg-rose-600'
      : type === 'warning'
        ? 'bg-amber-600'
        : 'bg-slate-800';

  return (
    <div className="fixed right-4 top-4 z-50">
      <div className={`${palette} rounded-lg px-4 py-3 text-sm font-medium text-white shadow-xl`}>{message}</div>
    </div>
  );
};
