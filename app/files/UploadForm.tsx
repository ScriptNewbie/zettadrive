"use client";

import { useState } from "react";
import { Dropzone, FileWithPath } from "@mantine/dropzone";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import { Group, Loader, rem, Stack, Text } from "@mantine/core";

export default function UploadPage() {
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = (acceptedFiles: FileWithPath[]) => {
    setFiles(acceptedFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("file", file);
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert(`Files uploaded successfully!`);
      }
    } catch (_) {
      alert("Error uploading files");
    } finally {
      location.reload();
    }
  };

  return (
    <Stack>
      {files.map((file) => (
        <Text key={file.path}>{file.path}</Text>
      ))}

      <form onSubmit={handleSubmit}>
        <Dropzone onDrop={handleDrop}>
          <Group
            justify="center"
            gap="xl"
            mih={220}
            style={{ pointerEvents: "none" }}
          >
            <Dropzone.Accept>
              <IconUpload
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: "var(--mantine-color-blue-6)",
                }}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: "var(--mantine-color-red-6)",
                }}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconPhoto
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: "var(--mantine-color-dimmed)",
                }}
                stroke={1.5}
              />
            </Dropzone.Idle>

            <div>
              <Text size="xl" inline>
                Drag files or click here or whatever
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Dropping new file will clear previously added as its not codded
                yet as it should
              </Text>
            </div>
          </Group>
        </Dropzone>
        {isUploading && <Loader />}
        <button disabled={isUploading} type="submit">
          Upload
        </button>
      </form>
    </Stack>
  );
}
