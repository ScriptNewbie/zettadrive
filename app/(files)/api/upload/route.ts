import { NextRequest, NextResponse } from "next/server";
import Busboy from "busboy";
import { Readable } from "stream";
import type { ReadableStream } from "node:stream/web";
import { database } from "@/app/db/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/(auth)/api/auth/[...nextauth]/authSetup";
import { fileStore, fileStoreStrategy } from "../../fileStoreStrategies";

export async function POST(req: NextRequest): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      {
        message: "User not authenticated",
      },
      { status: 401 }
    );
  }

  const contentType = req.headers.get("content-type");
  if (!contentType) {
    return NextResponse.json(
      {
        message: "No content type found",
      },
      { status: 400 }
    );
  }

  if (!req.body) {
    return NextResponse.json({ message: "No file found" }, { status: 400 });
  }

  const filesBeingUploaded: Promise<void>[] = [];

  return new Promise((resolve) => {
    const busboy = Busboy({ headers: { "content-type": contentType } });
    busboy.on(
      "file",
      async (field: string, file: Readable, { filename, mimeType }) => {
        const storeFile = async () => {
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
        };
        filesBeingUploaded.push(storeFile());
      }
    );

    busboy.on("finish", async () => {
      try {
        await Promise.all(filesBeingUploaded);
        resolve(NextResponse.json({ message: "success" }));
      } catch (_) {
        resolve(
          NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
          )
        );
      }
    });

    busboy.on("error", (err: Error) => {
      resolve(NextResponse.json({ message: err.message }, { status: 500 }));
    });

    const nodeReq = Readable.fromWeb(req.body as ReadableStream<Uint8Array>);
    nodeReq.pipe(busboy);
  });
}
