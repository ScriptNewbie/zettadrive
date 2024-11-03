import { FileStoreInterface } from "./fileStoreInterface"; // Adjust the import path as necessary
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

const PART_SIZE = 5 * 1024 * 1024;
const QUEUE_SIZE = 4;

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export const s3FileStore: FileStoreInterface = {
  store: (fileStream: Readable, storeName: string, fileName: string) => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const key = `${storeName}/${fileName}`;

        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key,
            Body: fileStream,
          },
          queueSize: QUEUE_SIZE,
          partSize: PART_SIZE,
          leavePartsOnError: false,
        });

        // upload.on("httpUploadProgress", (progress) => {
        //   console.log("Upload progress:", progress);
        // });

        await upload.done();
        resolve(key);
      } catch (error) {
        reject(new Error("Error uploading file to S3"));
      }
    });
  },

  retrieve: (retrieveString: string) => {
    return new Promise<{ stream: Readable; length: number }>(
      async (resolve, reject) => {
        try {
          const params = {
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: retrieveString,
          };

          const response = await s3Client.send(new GetObjectCommand(params));

          if (response.Body instanceof Readable) {
            resolve({
              stream: response.Body,
              length: response.ContentLength || 0,
            });
          } else if (response.Body) {
            const readableStream = Readable.from(response.Body as any); //Try making into readable
            resolve({
              stream: readableStream,
              length: response.ContentLength || 0,
            });
          } else {
            reject(new Error("No data received from S3 getObject"));
          }
        } catch (_) {
          reject(new Error("Error retrieving file from S3"));
        }
      }
    );
  },
  delete: (retrieveString: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const params = {
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: retrieveString,
        };

        await s3Client.send(new DeleteObjectCommand(params));
        resolve();
      } catch (error) {
        reject(new Error("Error deleting file from S3"));
      }
    });
  },
};
