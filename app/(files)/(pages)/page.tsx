import { getServerSession } from "next-auth";
import UploadPage from "./molecules/UploadForm";
import { authOptions } from "../../(auth)/api/auth/[...nextauth]/authSetup";
import { redirect } from "next/navigation";
import { database } from "../../db/database";
import { Box, Group } from "@mantine/core";
import { DeleteButton } from "./atoms/DeleteButton";

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
        <Group gap="xs" key={file.id}>
          <a target="_blank" href={`/api/download/${file.id}`}>
            {file.name}
          </a>
          <DeleteButton fileId={file.id} />
        </Group>
      ))}
      <UploadPage />
    </Box>
  );
}
