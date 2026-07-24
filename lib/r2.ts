import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

export async function uploadToR2(key: string, body: Blob | Buffer, contentType: string): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicUrl = process.env.R2_PUBLIC_URL || `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;

  // If R2 credentials are missing or invalid, fallback to base64 Data URL
  if (!accessKeyId || !secretAccessKey || accessKeyId.length < 16) {
    console.warn("[R2 Storage] R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is missing or invalid. Storing image as base64 Data URL.");
    const buffer = body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : body;
    return `data:${contentType || 'image/jpeg'};base64,${buffer.toString('base64')}`;
  }

  try {
    const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const upload = new Upload({
      client: r2,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : body,
        ContentType: contentType,
      },
    });
    await upload.done();
    return `${publicUrl.replace(/\/$/, '')}/${key}`;
  } catch (error) {
    console.error("[R2 Upload Error] Failed to upload to Cloudflare R2, falling back to base64 Data URL:", error);
    const buffer = body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : body;
    return `data:${contentType || 'image/jpeg'};base64,${buffer.toString('base64')}`;
  }
}