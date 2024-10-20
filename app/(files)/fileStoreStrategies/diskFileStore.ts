import { FileStoreInterface } from "./fileStoreInterface";
import { writeFile } from "fs/promises";
import * as fs from "fs";
import path from "path";
import { Readable } from "stream";

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
          reject(new Error("Error writing file"));
        });
      } catch (error) {
        console.error("Error in store method:", error);
        reject(new Error("Error storing file"));
      }
    });
  },
  retrieve: (filePath: string) => {
    return new Promise((resolve, reject) => {
      const fileReadStream = fs.createReadStream(filePath);

      fileReadStream.on("error", (error) => {
        console.error("Error reading file:", error);
        reject(new Error("File not found or cannot be read"));
      });

      fileReadStream.on("open", () => {
        resolve(fileReadStream);
      });
    });
  },
};
