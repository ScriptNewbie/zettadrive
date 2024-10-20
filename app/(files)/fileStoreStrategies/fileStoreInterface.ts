import { Readable } from "stream";

export interface FileStoreInterface {
  store(file: Readable, storeName: string, fileName: string): Promise<string>;
  retrieve(retrieveString: string): Promise<Readable>;
}
