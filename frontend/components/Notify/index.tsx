//@ts-nocheck

import React, { ReactNode } from "react";
import {
  toast,
  ToastContent,
  ToastOptions,
  ToastPromiseParams,
} from "react-toastify";
import { X } from "lucide-react"; // Import icon X

// --- CONFIGURATION ---
const GENERAL_ERROR = "An unexpected error occurred. Please try again later.";
const GENERAL_SUCCESS = "Completed successfully.";

// --- CUSTOM TOAST COMPONENT ---
// Đây là component tạo ra giao diện giống trong ảnh
interface CustomToastProps {
  message: ReactNode;
  closeToast?: () => void; // Props này do react-toastify tự truyền vào
  type?: "success" | "error" | "info";
}

const CustomToast = ({
  message,
  closeToast,
  type = "success",
}: CustomToastProps) => {
  const borderColors = {
    success: "border-green-400",
    error: "border-red-400",
    info: "border-blue-400",
  };

  return (
    <div
      className={`
        relative flex items-center justify-center w-full p-4 
        bg-white rounded-md shadow-sm border ${borderColors[type]}
      `}
    >
      <div className="text-sm font-medium text-gray-700 text-center">
        {message}
      </div>

      <button
        onClick={closeToast}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// --- CORE OPTIONS ---
// Style này giúp loại bỏ background mặc định của react-toastify
// để hiển thị trọn vẹn component CustomToast của chúng ta
const cleanStyleOptions: ToastOptions = {
  style: {
    background: "transparent",
    boxShadow: "none",
    padding: 0,
    minHeight: "auto",
  },
  bodyStyle: {
    margin: 0,
    padding: 0,
  },
  closeButton: false, // Tắt nút tắt mặc định của thư viện
  icon: false, // Tắt icon mặc định
  hideProgressBar: true, // Tắt thanh chạy (tùy chọn, trong ảnh không thấy có)
};

// --- EXPORTED FUNCTIONS ---

export const notifyError = (content?: unknown, options?: ToastOptions) => {
  const errorMessage =
    content instanceof Error
      ? content.message
      : typeof content === "string"
      ? content
      : undefined;
  const msg = errorMessage || GENERAL_ERROR;

  toast.error(<CustomToast message={msg} type="error" />, {
    ...cleanStyleOptions,
    autoClose: 10000,
    ...options,
  });
};

export const notifySuccess = (
  content?: ToastContent,
  options?: ToastOptions & { autoClose?: number }
) => {
  const { autoClose, ...rest } = options || {};
  const msg = content || GENERAL_SUCCESS;

  // Sử dụng toast() thay vì toast.success() để tránh các style mặc định của success type
  toast(<CustomToast message={msg} type="success" />, {
    ...cleanStyleOptions,
    autoClose: autoClose || 3000,
    ...rest,
  });
};

export const notifyInfo = (content: ReactNode, options?: ToastOptions) => {
  toast(<CustomToast message={content} type="info" />, {
    ...cleanStyleOptions,
    ...options,
  });
};

export const notifyPromise = async (
  promise: Promise<unknown> | (() => Promise<unknown>),
  toastPromiseParams?: ToastPromiseParams,
  options?: ToastOptions
) => {
  return toast.promise(
    promise,
    {
      pending: toastPromiseParams?.pending,
      success: {
        render({ data }) {
          const msg = toastPromiseParams?.success || GENERAL_SUCCESS;
          // Render custom toast cho promise success
          return (
            <CustomToast
              message={typeof msg === "function" ? msg(data) : msg}
              type="success"
            />
          );
        },
        ...cleanStyleOptions, // Áp dụng style clean
      },
      error: {
        render({ data }) {
          let msg = toastPromiseParams?.error || GENERAL_ERROR;
          if (data instanceof Error) msg = data.message;
          if (
            typeof data === "object" &&
            (data as any)?.response?.data?.message
          )
            msg = (data as any).response.data.message;
          if (typeof data === "string") msg = data;

          return <CustomToast message={msg} type="error" />;
        },
        ...cleanStyleOptions,
      },
    },
    options
  );
};
