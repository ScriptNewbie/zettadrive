import { diskFileStore } from "./diskFileStore";
import { s3FileStore } from "./s3FileStore";

export const fileStoreStrategies = {
  disk: diskFileStore,
  s3: s3FileStore,
};

export type fileStoreStrategyType = "disk" | "s3";

export const fileStoreStrategy = (process.env.STORE_STRATEGY ||
  "disk") as fileStoreStrategyType;

export const fileStore = fileStoreStrategies[fileStoreStrategy];
