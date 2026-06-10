type ToastProps = {
  message: string;
  visible: boolean;
};

export function Toast({ message, visible }: ToastProps) {
  return (
    <div className={`shortcut-toast ${visible ? "is-visible" : ""}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
