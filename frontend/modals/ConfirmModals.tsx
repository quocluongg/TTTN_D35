//@ts-nocheck
import { useState } from "react";

// @shared - components
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmModalProps = {
  modalState: any;
  size: any;
  title: string;
  content: any;
  labels?: {
    cancel?: string;
    action?: string;
  };
  onAction: () => void;
  actionProps?: any;
  async?: boolean;
};

const ConfirmModal = ({
  modalState,
  size,
  title,
  content,
  labels,
  actionProps,
  onAction,
  async,
}: ConfirmModalProps) => {
  // -- state --
  const [loading, setLoading] = useState(false);

  return (
    <AlertDialog {...modalState}>
      <AlertDialogContent size={size} onClose={() => modalState.close()}>
        {/* header */}
        <AlertDialogHeader>
          {/* title */}
          <AlertDialogTitle className="text-base font-medium uppercase text-foreground">
            {title ?? "Are you absolutely sure?"}
          </AlertDialogTitle>
        </AlertDialogHeader>

        {/* content */}
        <AlertDialogDescription>{content}</AlertDialogDescription>

        {/* footer */}
        <AlertDialogFooter className="!mt-8 px-4">
          {/* cancel button */}
          <AlertDialogCancel
            className="lg:w-[200px]"
            onClick={() => modalState.close()}
          >
            {labels?.cancel ?? "Cancel"}
          </AlertDialogCancel>

          {/* action button */}
          <Button
            className="lg:w-[200px]"
            loading={loading}
            onClick={async () => {
              if (!async) return modalState.resolve(onAction());

              // set loading
              setLoading(true);

              try {
                // call onAction method
                const result = await onAction();

                // resolve result
                modalState.resolve(result);

                // close modal
                modalState.close();

                // eslint-disable-next-line no-empty
              } catch (err) {
                // reject error
                modalState.reject(err);
              }

              // set loading
              setLoading(false);
            }}
            {...actionProps}
          >
            {labels?.action ?? "Continue"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { ConfirmModal };
