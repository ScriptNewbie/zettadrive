import { database } from "@/app/db/database";
import {
  fileStoreStrategies,
  fileStoreStrategyType,
} from "../fileStoreStrategies";
import { FileError } from "../errorHandling/FileError";

export const retrieveFile = async ({ fileId }: { fileId: string }) => {
  const file = await database.file.findFirst({
    where: { id: fileId },
  });

  if (!file) {
    throw new FileError("File not found", 404);
  }

  if (!file.retrieveString) {
    throw new FileError("Retrieve path for the file was not found", 500);
  }

  const fileStore =
    fileStoreStrategies[file.storeStrategy as fileStoreStrategyType];

  return {
    ...(await fileStore.retrieve(file.retrieveString)),
    name: file.name,
    type: file.type,
  };
};
