import { useState } from "react";

interface ToastData {
  matchedUserName: string;
  matchedUserAvatar?: string;
  chatId: string;
  userId: string;
}

export const useMatchToast = () => {
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  const showMatchToast = (data: ToastData) => {
    setToastData(data);
    setVisible(true);
  };

  const hideMatchToast = () => {
    setVisible(false);
    setTimeout(() => setToastData(null), 300);
  };

  return {
    toastData,
    visible,
    showMatchToast,
    hideMatchToast,
  };
};