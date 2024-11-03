import { database } from "@/app/db/database";
import {
  fileStoreStrategies,
  fileStoreStrategyType,
} from "../fileStoreStrategies";

type DeleteArguments =
  | {
      fileId: string;
      userId?: string;
      allowDeleteWithoutUserId: true;
    }
  | {
      fileId: string;
      userId: string;
      allowDeleteWithoutUserId?: false;
    };

export const deleteFile = async ({
  fileId,
  userId,
  allowDeleteWithoutUserId,
}: DeleteArguments) => {
  const file = await database.file.findFirst({
    where: allowDeleteWithoutUserId
      ? { id: fileId }
      : { id: fileId, userId: userId },
  });

  if (!file) {
    throw new Error("File not found");
  }

  if (!file.retrieveString) {
    return await database.file.delete({ where: { id: fileId } });
  }

  const fileStore =
    fileStoreStrategies[file.storeStrategy as fileStoreStrategyType];

  await fileStore.delete(file.retrieveString);
  return await database.file.delete({ where: { id: fileId } });
};
