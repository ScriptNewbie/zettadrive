import { authOptions } from "@/app/(auth)/api/auth/[...nextauth]/authSetup";
import { database } from "@/app/db/database";
import {
  fileStoreStrategies,
  fileStoreStrategyType,
} from "@/app/(files)/fileStoreStrategies";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  const file = await database.file.findFirst({
    where: { id: params.id },
  });

  const canSeeFile = file?.userId === session?.user?.id;

  if (!file || !canSeeFile) {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  if (!file.retrieveString) {
    return NextResponse.json(
      { message: "Retrieve path for the file was not found" },
      {
        status: 404,
      }
    );
  }

  const fileStore =
    fileStoreStrategies[file.storeStrategy as fileStoreStrategyType];
  const { stream, length } = await fileStore.retrieve(file.retrieveString);

  const responseStream = Readable.toWeb(stream);
  const headers = new Headers({
    "content-disposition": `attachment; filename="${file.name}"`,
    "content-type": file.type,
  });
  if (length) {
    headers.set("content-length", length.toString());
  }
  return new NextResponse(responseStream as ReadableStream<Uint8Array>, {
    headers,
  });
}
