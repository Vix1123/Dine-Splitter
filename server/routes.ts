import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import FormData from "form-data";
import https from "https";

interface TabscannerItem {
  desc?: string;
  description?: string;
  lineTotal?: number;
  price?: number;
  qty?: number;
  quantity?: number;
}

interface TabscannerResult {
  status: string;
  code?: number;
  message?: string;
  token?: string;
  result?: {
    lineItems?: TabscannerItem[];
    total?: number | string;
    subTotal?: number | string;
    currency?: string;
    currencyCode?: string;
  };
}

function httpsRequest(options: https.RequestOptions, body?: Buffer | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve(data);
      });
    });
    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollForResult(token: string, apiKey: string, maxAttempts: number = 30): Promise<TabscannerResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(1000);

    const options: https.RequestOptions = {
      hostname: "api.tabscanner.com",
      path: `/api/result/${token}`,
      method: "GET",
      headers: {
        apikey: apiKey,
      },
    };

    const data = await httpsRequest(options);
    console.log(`Poll attempt ${attempt + 1}:`, data.substring(0, 200));

    const response: TabscannerResult = JSON.parse(data);

    if (response.status === "done") {
      return response;
    }

    if (response.status === "failed" || response.code === 400) {
      throw new Error(response.message || "Receipt processing failed");
    }
  }

  throw new Error("Receipt processing timed out");
}

async function processReceiptWithTabscanner(
  imageBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{
  items: { description: string; price: number; quantity: number }[];
  total: number;
  currency: string;
}> {
  const apiKey = process.env.TABSCANNER_API_KEY;

  if (!apiKey) {
    throw new Error("TABSCANNER_API_KEY is not configured");
  }

  const formData = new FormData();
  formData.append("file", imageBuffer, {
    filename: filename,
    contentType: mimeType,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.tabscanner.com",
      path: "/api/2/process",
      method: "POST",
      headers: {
        ...formData.getHeaders(),
        apikey: apiKey,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", async () => {
        try {
          console.log("Tabscanner initial response:", data);
          const response: TabscannerResult = JSON.parse(data);

          if (response.code === 400 || response.status === "failed") {
            reject(new Error(response.message || "Failed to process receipt"));
            return;
          }

          if (response.token) {
            console.log("Got token, polling for results:", response.token);
            try {
              const result = await pollForResult(response.token, apiKey);
              console.log("Final result:", JSON.stringify(result, null, 2));

              const resultData = result.result || {};
              const lineItems = resultData.lineItems || [];

              console.log("Line items found:", lineItems.length);

              const items = lineItems.map((item: TabscannerItem, index: number) => ({
                description: item.desc || item.description || `Item ${index + 1}`,
                price: item.lineTotal || item.price || 0,
                quantity: item.qty || item.quantity || 1,
              }));

              const totalValue = resultData.total || resultData.subTotal || 0;
              const total = typeof totalValue === "string" ? parseFloat(totalValue) : totalValue;
              const calculatedTotal = total || items.reduce(
                (sum: number, item: { price: number }) => sum + item.price,
                0
              );
              const currency = resultData.currencyCode || resultData.currency || "USD";

              resolve({
                items,
                total: calculatedTotal,
                currency,
              });
            } catch (pollError) {
              reject(pollError);
            }
          } else if (response.status === "done" && response.result) {
            const resultData = response.result;
            const lineItems = resultData.lineItems || [];

            const items = lineItems.map((item: TabscannerItem, index: number) => ({
              description: item.desc || item.description || `Item ${index + 1}`,
              price: item.lineTotal || item.price || 0,
              quantity: item.qty || item.quantity || 1,
            }));

            const totalValue = resultData.total || resultData.subTotal || 0;
            const total = typeof totalValue === "string" ? parseFloat(totalValue) : totalValue;
            const calculatedTotal = total || items.reduce(
              (sum: number, item: { price: number }) => sum + item.price,
              0
            );
            const currency = resultData.currencyCode || resultData.currency || "USD";

            resolve({
              items,
              total: calculatedTotal,
              currency,
            });
          } else {
            console.error("Unexpected response format:", response);
            reject(new Error("Unexpected response from receipt processing service"));
          }
        } catch (error) {
          console.error("Error parsing Tabscanner response:", error);
          reject(new Error("Failed to parse receipt data"));
        }
      });
    });

    req.on("error", (error) => {
      console.error("Tabscanner request error:", error);
      reject(new Error("Failed to connect to receipt processing service"));
    });

    formData.pipe(req);
  });
}

function generateMockReceiptData(): {
  items: { description: string; price: number; quantity: number }[];
  total: number;
  currency: string;
} {
  const items = [
    { description: "Grilled Salmon", price: 24.99, quantity: 1 },
    { description: "Caesar Salad", price: 12.50, quantity: 2 },
    { description: "Margherita Pizza", price: 18.00, quantity: 1 },
    { description: "Sparkling Water", price: 4.50, quantity: 3 },
    { description: "Tiramisu", price: 8.99, quantity: 2 },
    { description: "Espresso", price: 3.50, quantity: 4 },
  ];

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    items: items.map((item) => ({
      ...item,
      price: item.price * item.quantity,
    })),
    total,
    currency: "USD",
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const multer = await import("multer");
  const upload = multer.default({ storage: multer.memoryStorage() });

  app.post(
    "/api/scan-receipt",
    upload.single("receipt"),
    async (req: Request, res: Response) => {
      try {
        const file = req.file;

        if (!file) {
          return res.status(400).json({ message: "No receipt image provided" });
        }

        const hasTabscannerKey = !!process.env.TABSCANNER_API_KEY;

        if (hasTabscannerKey) {
          try {
            console.log("Processing receipt with Tabscanner...");
            const result = await processReceiptWithTabscanner(
              file.buffer,
              file.originalname,
              file.mimetype
            );

            console.log("Receipt processed:", JSON.stringify(result));
            return res.json(result);
          } catch (error: any) {
            console.error("Tabscanner processing failed:", error);
            return res.status(500).json({
              message:
                error.message ||
                "Failed to process receipt. Try a clearer photo.",
            });
          }
        } else {
          console.log(
            "TABSCANNER_API_KEY not configured, returning mock data for demo"
          );
          const mockData = generateMockReceiptData();
          return res.json(mockData);
        }
      } catch (error: any) {
        console.error("Receipt scan error:", error);
        return res.status(500).json({
          message: error.message || "Failed to process receipt",
        });
      }
    }
  );

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
