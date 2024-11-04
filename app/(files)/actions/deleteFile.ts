"use server";

import { getServerSession } from "next-auth";
import { deleteFile } from "../operations/deleteFile";
import { authOptions } from "@/app/(auth)/api/auth/[...nextauth]/authSetup";
import { unexpectedErrorMessage } from "@/app/shared/errorHandling/UnexpectedErrorResponse";
import { FileError } from "../errorHandling/FileError";

export const deleteFileAction = async (fileId: string) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "User not authenticated" };
  }
  try {
    return await deleteFile({ fileId, userId: session.user.id });
  } catch (error) {
    if (error instanceof FileError) {
      return { error: error.message };
    }
    return { error: unexpectedErrorMessage };
  }
};
