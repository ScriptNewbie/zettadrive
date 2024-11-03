import { database } from "@/app/db/database";
import {
  fileStoreStrategies,
  fileStoreStrategyType,
} from "../fileStoreStrategies";

export const retrieveFile = async ({ fileId }: { fileId: string }) => {
  const file = await database.file.findFirst({
    where: { id: fileId },
  });

  if (!file) {
    throw new Error("File not found");
  }

  if (!file.retrieveString) {
    throw new Error("Retrieve path for the file was not found");
  }

  const fileStore =
    fileStoreStrategies[file.storeStrategy as fileStoreStrategyType];

  return {
    ...(await fileStore.retrieve(file.retrieveString)),
    name: file.name,
    type: file.type,
  };
};
