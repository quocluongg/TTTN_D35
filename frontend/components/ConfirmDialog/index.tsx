"use client";

import React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  danger,
  onConfirm,
}: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        {/* Backdrop Overlay */}
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150" />
        
        {/* Basic Clean Content Box */}
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-6 shadow-xl animate-in zoom-in-95 duration-150 font-sans">
          
          <div className="flex items-center justify-between">
            <AlertDialog.Title className="text-lg font-bold">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Cancel asChild>
              <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer">
                <X size={18} />
              </button>
            </AlertDialog.Cancel>
          </div>

          {description && (
            <AlertDialog.Description className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {description}
            </AlertDialog.Description>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <AlertDialog.Cancel className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              {cancelText}
            </AlertDialog.Cancel>

            <AlertDialog.Action
              onClick={onConfirm}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                danger
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
              }`}
            >
              {confirmText}
            </AlertDialog.Action>
          </div>

        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
