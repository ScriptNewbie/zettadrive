import { FileStoreInterface } from "./fileStoreInterface"; // Adjust the import path as necessary
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

const PART_SIZE = 5 * 1024 * 1024; // 5MB

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
      let uploadId: string | undefined;
      const bucketName = process.env.S3_BUCKET_NAME!;

      try {
        const createMultipart = await s3Client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: `${storeName}/${fileName}`,
          })
        );
        uploadId = createMultipart.UploadId!;
        if (!uploadId) throw new Error("Failed to initiate multipart upload.");

        const parts: { ETag: string; PartNumber: number }[] = [];
        let partNumber = 1;
        let buffer: Buffer[] = [];
        let bufferLength = 0;

        fileStream.on("data", async (chunk) => {
          buffer.push(chunk);
          bufferLength += chunk.length;

          if (bufferLength >= PART_SIZE) {
            fileStream.pause();

            const partBuffer = Buffer.concat(buffer, bufferLength);
            const uploadPart = await s3Client.send(
              new UploadPartCommand({
                Bucket: bucketName,
                Key: `${storeName}/${fileName}`,
                PartNumber: partNumber,
                UploadId: uploadId,
                Body: partBuffer,
              })
            );

            parts.push({ ETag: uploadPart.ETag!, PartNumber: partNumber });
            partNumber++;
            buffer = [];
            bufferLength = 0;

            fileStream.resume();
          }
        });

        fileStream.on("end", async () => {
          if (buffer.length > 0) {
            const partBuffer = Buffer.concat(buffer, bufferLength);
            const uploadPart = await s3Client.send(
              new UploadPartCommand({
                Bucket: bucketName,
                Key: `${storeName}/${fileName}`,
                PartNumber: partNumber,
                UploadId: uploadId,
                Body: partBuffer,
              })
            );

            parts.push({ ETag: uploadPart.ETag!, PartNumber: partNumber });
          }

          await s3Client.send(
            new CompleteMultipartUploadCommand({
              Bucket: bucketName,
              Key: `${storeName}/${fileName}`,
              UploadId: uploadId,
              MultipartUpload: {
                Parts: parts,
              },
            })
          );

          const retrieveString = `${storeName}/${fileName}`;
          resolve(retrieveString);
        });

        fileStream.on("error", async (error) => {
          console.error("Stream error:", error);
          if (uploadId) {
            // Abort multipart upload on error
            await s3Client.send(
              new AbortMultipartUploadCommand({
                Bucket: bucketName,
                Key: `${storeName}/${fileName}`,
                UploadId: uploadId,
              })
            );
          }
          reject(new Error("Error uploading file to S3"));
        });
      } catch (error) {
        console.error("Error uploading file to S3:", error);
        if (uploadId) {
          // Abort multipart upload on error
          await s3Client.send(
            new AbortMultipartUploadCommand({
              Bucket: process.env.S3_BUCKET_NAME!,
              Key: `${storeName}/${fileName}`,
              UploadId: uploadId,
            })
          );
        }
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
};
