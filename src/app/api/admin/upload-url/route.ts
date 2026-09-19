import { NextResponse, type NextRequest } from "next/server";
import { safeFileName } from "@/lib/admin/catalog-admin";
import { uploadRequestSchema } from "@/lib/admin/schemas";
import { signedUploadUrl, storageMode } from "@/lib/storage";
import { adminErrorResponse } from "../_shared";

/**
 * Step one of an upload: the browser asks where to PUT the bytes. With R2
 * that is a presigned bucket URL, so a 700 MB file never touches the app
 * server; locally it is our own PUT route.
 */
export async function POST(request: NextRequest) {
  try {
    const { name, sizeBytes } = uploadRequestSchema.parse(await request.json());
    const fileName = safeFileName(name);

    if (storageMode() === "r2") {
      return NextResponse.json({
        fileName,
        url: await signedUploadUrl(fileName, sizeBytes),
        method: "PUT",
        direct: true,
      });
    }

    return NextResponse.json({
      fileName,
      url: `/api/admin/upload/${fileName}`,
      method: "PUT",
      direct: false,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
