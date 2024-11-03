import { database } from "@/app/db/database";
import { fileStore, fileStoreStrategy } from "../fileStoreStrategies";
import { Readable } from "stream";

export const storeFile = async (
  file: Readable,
  {
    filename,
    mimeType,
    userId,
  }: { filename: string; mimeType: string; userId: string }
) => {
  const { id } = await database.file.create({
    data: {
      name: filename,
      type: mimeType,
      storeStrategy: fileStoreStrategy,
      userId,
    },
  });
  const retrieveString = await fileStore.store(file, userId, filename);
  await database.file.update({
    where: { id },
    data: { retrieveString },
  });
};
