/**
 * Response Auto-Saver Utility
 * Automatically generates and saves API responses as .txt files
 */

/**
 * Format response data into readable text
 */
export function formatResponseText(data: any, endpoint: string, status: number): string {
  const timestamp = new Date().toISOString();
  const lines = [
    "=".repeat(70),
    "API RESPONSE - AUTO-SAVED",
    "=".repeat(70),
    "",
    `Timestamp: ${timestamp}`,
    `Endpoint: ${endpoint}`,
    `Status: ${status}`,
    "",
    "Response Data:",
    "-".repeat(70),
    JSON.stringify(data, null, 2),
    "",
    "=".repeat(70),
  ];

  return lines.join("\n");
}

/**
 * Generate filename with current date
 */
export function generateSaveFileName(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `api-responses-${year}-${month}-${day}-${hours}${minutes}${seconds}.txt`;
}

/**
 * Download response as .txt file
 */
export function downloadResponseAsFile(
  content: string,
  filename: string = generateSaveFileName()
): void {
  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✓ Response saved: ${filename}`);
  } catch (error) {
    console.error("Error saving response:", error);
  }
}

/**
 * Auto-save response (format + download)
 */
export function autoSaveResponse(
  responseData: any,
  endpoint: string,
  statusCode: number
): void {
  try {
    const formattedText = formatResponseText(responseData, endpoint, statusCode);
    const filename = generateSaveFileName();
    downloadResponseAsFile(formattedText, filename);
  } catch (error) {
    console.error("Error auto-saving response:", error);
  }
}

/**
 * Batch save multiple responses to single file
 */
export function batchSaveResponses(
  responses: Array<{
    data: any;
    endpoint: string;
    status: number;
    clientId?: string;
    loanId?: string;
    request?: any;
  }>
): void {
  try {
    const lines = [
      "=".repeat(70),
      "BATCH API RESPONSES - AUTO-SAVED",
      `Date: ${new Date().toISOString()}`,
      `Total Responses: ${responses.length}`,
      "=".repeat(70),
      "",
    ];

    responses.forEach((resp, index) => {
      lines.push(`Response ${index + 1}:`);
      lines.push("-".repeat(70));
      if (resp.clientId) lines.push(`Client ID: ${resp.clientId}`);
      if (resp.loanId) lines.push(`Loan ID: ${resp.loanId}`);
      lines.push(`Endpoint: ${resp.endpoint}`);
      lines.push(`Status: ${resp.status}`);
      lines.push("");
      
      if (resp.request) {
        lines.push("Request Body:");
        lines.push(JSON.stringify(resp.request, null, 2));
        lines.push("");
        lines.push("Response Data:");
      }
      
      lines.push(JSON.stringify(resp.data, null, 2));
      lines.push("");
      lines.push("=".repeat(70));
      lines.push("");
    });

    const content = lines.join("\n");
    const filename = `batch-responses-${new Date().getTime()}.txt`;
    downloadResponseAsFile(content, filename);
  } catch (error) {
    console.error("Error batch saving responses:", error);
  }
}
