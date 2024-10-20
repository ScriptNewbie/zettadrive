import { authOptions } from "@/app/(auth)/api/auth/[...nextauth]/route";
import { database } from "@/app/(db)/database";
import { diskFileStore } from "@/app/(files)/fileStoreStrategies/diskFileStore";
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
    return new NextResponse("File not found", { status: 404 });
  }

  if (!file.retrieveString) {
    return new NextResponse("Retrieve path for the file was not found", {
      status: 404,
    });
  }

  const fileStream = await diskFileStore.retrieve(file.retrieveString);
  const responseStream = Readable.toWeb(fileStream);
  const headers = new Headers({ type: file.type });

  return new NextResponse(responseStream as ReadableStream<Uint8Array>, {
    headers,
  });
}
