import { authOptions } from "@/app/(auth)/api/auth/[...nextauth]/authSetup";
import Busboy from "busboy";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { ReadableStream } from "node:stream/web";
import { Readable } from "stream";
import { storeFile } from "../../operations/storeFile";

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
      (field: string, file: Readable, { filename, mimeType }) => {
        filesBeingUploaded.push(
          storeFile(file, { filename, mimeType, userId: session.user.id })
        );
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
