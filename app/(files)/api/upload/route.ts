import { NextRequest, NextResponse } from "next/server";
import Busboy from "busboy";
import { Readable } from "stream";
import { diskFileStore } from "../../fileStoreStrategies/diskFileStore";
import type { ReadableStream } from "node:stream/web";
import { database } from "@/app/(db)/database";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers.get("content-type");

    if (!contentType) {
      return reject(
        NextResponse.json({
          status: "fail",
          data: "No content type found",
        })
      );
    }

    const busboy = Busboy({ headers: { "content-type": contentType } });

    busboy.on(
      "file",
      async (field: string, file: Readable, { filename, mimeType }) => {
        const { id } = await database.file.create({
          data: { name: filename, type: mimeType, storeStrategy: "disk" },
        });
        const retrieveString = await diskFileStore.store(
          file,
          "shared",
          filename
        );
        await database.file.update({
          where: { id },
          data: { retrieveString },
        });
      }
    );

    busboy.on("finish", () => {
      resolve(NextResponse.json({ status: "success" }));
    });

    busboy.on("error", (err: Error) => {
      reject(NextResponse.json({ status: "fail", data: err.message }));
    });

    if (!req.body) {
      return reject(
        NextResponse.json({ status: "fail", data: "No file found" })
      );
    }

    const nodeReq = Readable.fromWeb(req.body as ReadableStream<Uint8Array>);
    nodeReq.pipe(busboy);
  });
}
