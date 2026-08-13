import { afterEach, describe, expect, it } from "vitest";
import { AppError } from "../../src/middleware/errorHandler";
import { swatIngestionService } from "../../src/services/swatIngestion.service";

const originalPlatform = process.platform;

function setPlatform(value: NodeJS.Platform) {
  Object.defineProperty(process, "platform", {
    configurable: true,
    value,
  });
}

describe("backend services/swatIngestionService", () => {
  afterEach(() => {
    setPlatform(originalPlatform);
    delete process.env.SWAT_IMPORT_SCRIPT_PATH;
  });

  it("rejects MDB import modes on non-Windows environments before touching the DB", async () => {
    setPlatform("linux");

    await expect(
      swatIngestionService.importSwat({
        importMode: "import",
      })
    ).rejects.toMatchObject<AppError>({
      statusCode: 400,
      message: expect.stringContaining("only supported on a local Windows backend"),
    });
  });

  it("rejects missing PowerShell scripts on Windows", () => {
    setPlatform("win32");
    process.env.SWAT_IMPORT_SCRIPT_PATH = "Z:\\missing\\import_swat_output.ps1";

    expect(() =>
      (swatIngestionService as any).ensureExternalImportSupport("import")
    ).toThrow("SWAT import script not found");
  });

  it("builds a 412 AppError when the MDB source is unavailable", () => {
    const error = (swatIngestionService as any).buildScriptFailureError(1, [
      "Impossible de trouver SWATOutput.mdb",
    ]) as AppError;

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(412);
    expect(error.message).toContain("SWAT MDB source unavailable");
  });

  it("builds a 500 AppError for generic script failures", () => {
    const error = (swatIngestionService as any).buildScriptFailureError(2, [
      "generic failure",
    ]) as AppError;

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(500);
    expect(error.message).toContain("SWAT Access import script failed");
  });
});
