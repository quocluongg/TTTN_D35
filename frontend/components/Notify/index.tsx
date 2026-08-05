"use client";

import React, { ReactNode } from "react";
import { toast, ToastContent, ToastOptions, ToastPromiseParams } from "react-toastify";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

// --- CONFIGURATION ---
const GENERAL_ERROR = "Đã có lỗi xảy ra. Vui lòng thử lại sau!";
const GENERAL_SUCCESS = "Thao tác thành công.";

// --- CLEAN & MODERN MINIMALIST TOAST COMPONENT ---
interface CustomToastProps {
  message: ReactNode;
  closeToast?: () => void;
  type?: "success" | "error" | "info";
}

const CustomToast = ({ message, closeToast, type = "success" }: CustomToastProps) => {
  const configs = {
    success: {
      border: "border-emerald-500/20",
      bg: "bg-white dark:bg-zinc-900",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    },
    error: {
      border: "border-red-500/20",
      bg: "bg-white dark:bg-zinc-900",
      icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    },
    info: {
      border: "border-blue-500/20",
      bg: "bg-white dark:bg-zinc-900",
      icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    },
  };

  const config = configs[type];

  return (
    <div
      className={`
        relative flex items-center gap-3 w-full min-w-[300px] max-w-[400px] p-4 rounded-lg
        ${config.bg} text-zinc-900 dark:text-zinc-100 
        border ${config.border} shadow-lg shadow-black/5 dark:shadow-black/40
        transition-all duration-200 font-sans text-sm font-medium
      `}
    >
      {/* Icon */}
      {config.icon}

      {/* Content */}
      <div className="flex-1 pr-6 leading-snug">
        {message}
      </div>

      {/* Close Button */}
      <button
        onClick={closeToast}
        className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        aria-label="Đóng"
      >
        <X size={15} />
      </button>
    </div>
  );
};

// --- CLEAN STYLE OPTIONS FOR REACT-TOASTIFY ---
const cleanStyleOptions: ToastOptions = {
  style: {
    background: "transparent",
    boxShadow: "none",
    padding: 0,
    minHeight: "auto",
  },
  closeButton: false,
  icon: false,
  hideProgressBar: true,
};

// --- EXPORTED NOTIFY FUNCTIONS ---

export const notifyError = (content?: unknown, options?: ToastOptions) => {
  const errorMessage =
    content instanceof Error
      ? content.message
      : typeof content === "string"
      ? content
      : undefined;
  const msg = errorMessage || GENERAL_ERROR;

  toast.error(<CustomToast message={msg as ReactNode} type="error" />, {
    ...cleanStyleOptions,
    autoClose: 3500,
    ...options,
  });
};

export const notifySuccess = (
  content?: ToastContent,
  options?: ToastOptions & { autoClose?: number }
) => {
  const { autoClose, ...rest } = options || {};
  const msg = content || GENERAL_SUCCESS;

  toast(<CustomToast message={msg as ReactNode} type="success" />, {
    ...cleanStyleOptions,
    autoClose: autoClose || 3000,
    ...rest,
  });
};

export const notifyInfo = (content: ReactNode, options?: ToastOptions) => {
  toast(<CustomToast message={content} type="info" />, {
    ...cleanStyleOptions,
    autoClose: 3500,
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
          return (
            <CustomToast
              message={typeof msg === "function" ? (msg as any)(data) : (msg as ReactNode)}
              type="success"
            />
          );
        },
        ...cleanStyleOptions,
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

          return <CustomToast message={msg as ReactNode} type="error" />;
        },
        ...cleanStyleOptions,
      },
    },
    options
  );
};
