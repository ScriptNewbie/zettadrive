import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { retrieveFile } from "@/app/(files)/operations/retrieveFile";
import { canDownloadFile } from "@/app/(auth)/utils/canDownloadFile";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/(auth)/api/auth/[...nextauth]/authSetup";

export async function GET(
  req: NextRequest,
  { params }: { params: { id?: string } }
) {
  if (!params.id) {
    return NextResponse.json({ message: "Specify file ID!" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const isAllowedToDownload = await canDownloadFile({
      fileId: params.id,
      userId: session?.user?.id,
    });
    if (!isAllowedToDownload) {
      return NextResponse.json(
        { message: "You don't have permission to download this file!" },
        { status: 403 }
      );
    }
  } catch (_) {
    return NextResponse.json(
      { message: "An unexpected error ocurred!" },
      { status: 500 }
    );
  }

  try {
    const { stream, length, name, type } = await retrieveFile({
      fileId: params.id,
    });

    const responseStream = Readable.toWeb(stream);
    const headers = new Headers({
      "content-disposition": `attachment; filename="${name}"`,
      "content-type": type,
    });
    if (length) {
      headers.set("content-length", length.toString());
    }
    return new NextResponse(responseStream as ReadableStream<Uint8Array>, {
      headers,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "An unexpected error ocurred!" },
      { status: 500 }
    );
  }
}
