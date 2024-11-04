import { database } from "@/app/db/database";
import {
  fileStoreStrategies,
  fileStoreStrategyType,
} from "../fileStoreStrategies";
import { FileError } from "../errorHandling/FileError";

interface DeleteArguments {
  fileId: string;
  userId: string;
}

export const deleteFile = async ({ fileId, userId }: DeleteArguments) => {
  const file = await database.file.findFirst({
    where: { id: fileId, userId: userId },
  });

  if (!file) {
    throw new FileError("File not found", 404);
  }

  if (!file.retrieveString) {
    return await database.file.delete({ where: { id: fileId } });
  }

  const fileStore =
    fileStoreStrategies[file.storeStrategy as fileStoreStrategyType];

  await fileStore.delete(file.retrieveString);
  return await database.file.delete({ where: { id: fileId } });
};
