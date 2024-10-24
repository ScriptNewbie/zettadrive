import { getServerSession } from "next-auth";
import UploadPage from "./files/UploadForm";
import { authOptions } from "./(auth)/api/auth/[...nextauth]/authSetup";
import { redirect } from "next/navigation";
import { database } from "./db/database";
import { Box } from "@mantine/core";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return redirect("/api/auth/signin");
  }

  const files = await database.file.findMany({
    where: { userId: session.user.id },
  });

  return (
    <Box>
      {files.map((file) => (
        <div key={file.id}>
          <a target="_blank" href={`/api/download/${file.id}`}>
            {file.name}
          </a>
        </div>
      ))}
      <UploadPage />
    </Box>
  );
}
