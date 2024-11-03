"use client";
import { Button } from "@mantine/core";
import { useState } from "react";
import { deleteFileAction } from "../../actions/deleteFile";
import { unexpectedErrorMessage } from "@/app/shared/errorHandling/UnexpectedErrorResponse";

export const DeleteButton = ({ fileId }: { fileId: string }) => {
  const [isPending, setIsPending] = useState(false);
  return (
    <Button
      color="red"
      loading={isPending}
      variant="outline"
      onClick={async () => {
        if (confirm("Are you sure you want to delete this file?")) {
          setIsPending(true);
          try {
            const res = await deleteFileAction(fileId);
            if ("error" in res) {
              return alert(res.error);
            }
            location.reload();
          } catch (_) {
            alert(unexpectedErrorMessage);
          } finally {
            setIsPending(false);
          }
        }
      }}
    >
      Delete file
    </Button>
  );
};
