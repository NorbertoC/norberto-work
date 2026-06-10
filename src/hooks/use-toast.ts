import { useCallback, useEffect, useRef, useState } from "react";

type ToastState = {
  message: string;
  visible: boolean;
};

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });
  const timerRef = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    window.clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = window.setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 2200);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  return { showToast, toast };
};
