import {
  BlobServiceClient,
  ContainerClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER || "uploads";
const accountName = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const sasTokenDuration = Number(process.env.SAS_TOKEN_DURATION) || 3600;
const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const azureEnabled =
  Boolean(connectionString) && Boolean(accountName) && Boolean(accountKey);

if (isProduction && !azureEnabled) {
  throw new Error(
    "Missing Azure Storage configuration. Set AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_ACCOUNT, and AZURE_STORAGE_ACCOUNT_KEY."
  );
}

const blobServiceClient = azureEnabled
  ? BlobServiceClient.fromConnectionString(connectionString as string)
  : (null as unknown as BlobServiceClient);
const containerClient: ContainerClient = azureEnabled
  ? blobServiceClient.getContainerClient(containerName)
  : (null as unknown as ContainerClient);

export function getBlobUrl(
  filename: string,
  expiresInSeconds = sasTokenDuration
): string {
  if (!azureEnabled) {
    // Development fallback: serve a static-ish path; callers can replace if needed
    return `/uploads/${filename}`;
  }
  const blobClient = containerClient.getBlobClient(filename);
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: filename,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn: new Date(new Date().valueOf() + expiresInSeconds * 1000),
    },
    new StorageSharedKeyCredential(accountName as string, accountKey as string)
  ).toString();

  return `${blobClient.url}?${sasToken}`;
}

export async function uploadBlob(
  filename: string,
  data: Buffer | Readable
): Promise<void> {
  if (!azureEnabled) {
    console.warn("uploadBlob skipped (Azure disabled in this environment).");
    return;
  }
  const blockBlobClient = containerClient.getBlockBlobClient(filename);
  if (Buffer.isBuffer(data)) {
    await blockBlobClient.uploadData(data);
  } else {
    await blockBlobClient.uploadStream(data);
  }
}

export async function deleteBlob(filename: string): Promise<void> {
  if (!azureEnabled) {
    console.warn("deleteBlob skipped (Azure disabled in this environment).");
    return;
  }
  const blobClient = containerClient.getBlobClient(filename);
  await blobClient.deleteIfExists();
}

export { containerClient };
