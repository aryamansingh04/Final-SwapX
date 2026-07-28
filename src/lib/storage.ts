export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ path: string; publicUrl: string }> {
  const publicUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  return {
    path: `${bucket}/${path}`,
    publicUrl,
  };
}

export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  return path.startsWith("data:") ? path : `/${bucket}/${path}`;
}
