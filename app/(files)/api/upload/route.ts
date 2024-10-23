import { NextRequest, NextResponse } from "next/server";
import Busboy from "busboy";
import { Readable } from "stream";
import type { ReadableStream } from "node:stream/web";
import { database } from "@/app/db/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/(auth)/api/auth/[...nextauth]/route";
import { fileStore, fileStoreStrategy } from "../../fileStoreStrategies";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      {
        status: "fail",
        data: "User not authenticated",
      },
      { status: 401 }
    );
  }

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
          data: {
            name: filename,
            type: mimeType,
            storeStrategy: fileStoreStrategy,
            userId: session.user.id,
          },
        });
        const retrieveString = await fileStore.store(
          file,
          session.user.id,
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
