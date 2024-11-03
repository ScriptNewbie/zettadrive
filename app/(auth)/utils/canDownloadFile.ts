import { database } from "@/app/db/database";

export const canDownloadFile = async ({
  fileId,
  userId,
  token,
}: {
  fileId: string;
  userId?: string;
  token?: string;
}) => {
  if (!userId && !token) {
    return false;
  }
  const file = await database.file.findFirst({
    where: { id: fileId, userId: userId },
  });

  if (!file) {
    return false;
  }

  return true;
};
