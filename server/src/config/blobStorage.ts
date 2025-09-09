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
const accountName = process.env.AZURE_STORAGE_ACCOUNT!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;

if (!connectionString) {
  throw new Error("Missing Azure Storage connection string");
}

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);
const containerClient: ContainerClient =
  blobServiceClient.getContainerClient(containerName);

export function getBlobUrl(filename: string, expiresInSeconds = 3600): string {
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
    return blobClient.url;
  }
}

export async function uploadBlob(
  filename: string,
  data: Buffer | Readable
): Promise<void> {
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
  try {
    const blobClient = containerClient.getBlobClient(filename);
    await blobClient.deleteIfExists();
  } catch (error) {
    console.error("Error deleting blob:", error);
    throw error;
  }
}

export { containerClient };
