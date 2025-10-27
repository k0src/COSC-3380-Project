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

// Make Azure blob storage optional for local development
const isAzureConfigured = !!(connectionString && accountName && accountKey);

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

if (isAzureConfigured && connectionString) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);
  console.log("✓ Azure Blob Storage configured");
} else {
  console.warn("⚠ Azure Blob Storage not configured - blob URLs will return placeholder paths");
}

export function getBlobUrl(
  filename: string,
  expiresInSeconds = sasTokenDuration
): string {
  if (!isAzureConfigured || !containerClient || !accountName || !accountKey) {
    // Return placeholder URL when Azure is not configured
    return `/placeholder/${filename}`;
  }

  const blobClient = containerClient.getBlobClient(filename);
  try {
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: filename,
        permissions: BlobSASPermissions.parse("r"),
        expiresOn: new Date(new Date().valueOf() + expiresInSeconds * 1000),
      },
      new StorageSharedKeyCredential(accountName, accountKey)
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  } catch (error) {
    console.error("Could not generate SAS token:", error);
    throw new Error("Could not generate SAS token");
  }
}

export async function uploadBlob(
  filename: string,
  data: Buffer | Readable
): Promise<void> {
  if (!isAzureConfigured || !containerClient) {
    console.warn("Azure Blob Storage not configured - skipping upload");
    return;
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(filename);

    if (Buffer.isBuffer(data)) {
      await blockBlobClient.uploadData(data);
    } else {
      await blockBlobClient.uploadStream(data);
    }
  } catch (error) {
    console.error("Error uploading blob:", error);
    throw error;
  }
}

export async function deleteBlob(filename: string): Promise<void> {
  if (!isAzureConfigured || !containerClient) {
    console.warn("Azure Blob Storage not configured - skipping delete");
    return;
  }

  try {
    const blobClient = containerClient.getBlobClient(filename);
    await blobClient.deleteIfExists();
  } catch (error) {
    console.error("Error deleting blob:", error);
    throw error;
  }
}

export { containerClient };