import { FileStoreInterface } from "./fileStoreInterface";
import * as fs from "fs";
import path from "path";
import { Readable } from "stream";
import { FileError } from "../errorHandling/FileError";

export const diskFileStore: FileStoreInterface = {
  store: (fileStream: Readable, storeName: string, fileName: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const filePath = path.join(
          process.cwd(),
          "uploads",
          storeName,
          fileName
        );
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

        const writeStream = fs.createWriteStream(filePath);
        fileStream.pipe(writeStream);

        writeStream.on("finish", () => {
          resolve(filePath);
        });

        writeStream.on("error", (error) => {
          console.error("Error writing file:", error);
          reject(new FileError("Error writing file", 500));
        });
      } catch (error) {
        console.error("Error in store method:", error);
        reject(new FileError("Error storing file", 500));
      }
    });
  },
  retrieve: (filePath: string) => {
    return new Promise((resolve, reject) => {
      const fileReadStream = fs.createReadStream(filePath);

      fileReadStream.on("error", (error) => {
        console.error("Error reading file:", error);
        reject(new FileError("File not found or cannot be read", 404));
      });

      fileReadStream.on("open", () => {
        resolve({ stream: fileReadStream, length: fs.statSync(filePath).size });
      });
    });
  },
  delete: (filePath: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await fs.promises.unlink(filePath);
        resolve();
      } catch (_) {
        reject(new FileError("Error deleting file", 500));
      }
    });
  },
};
