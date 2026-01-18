import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import FormData from "form-data";
import https from "https";
import http from "http";

interface TabscannerItem {
  desc?: string;
  description?: string;
  lineTotal?: number;
  price?: number;
  qty?: number;
  quantity?: number;
}

interface TabscannerResponse {
  status: string;
  result?: {
    lineItems?: TabscannerItem[];
    total?: number;
    currency?: string;
    currencyCode?: string;
  };
  message?: string;
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

      res.on("end", () => {
        try {
          const response: TabscannerResponse = JSON.parse(data);

          if (response.status !== "done" && response.status !== "success") {
            console.error("Tabscanner response:", response);
            reject(new Error(response.message || "Failed to process receipt"));
            return;
          }

          const result = response.result || {};
          const lineItems = result.lineItems || [];
          
          const items = lineItems.map((item: TabscannerItem, index: number) => ({
            description: item.desc || item.description || `Item ${index + 1}`,
            price: item.lineTotal || item.price || 0,
            quantity: item.qty || item.quantity || 1,
          }));

          const total =
            result.total ||
            items.reduce(
              (sum: number, item: { price: number }) => sum + item.price,
              0
            );
          const currency = result.currencyCode || result.currency || "USD";

          resolve({
            items,
            total,
            currency,
          });
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
            const result = await processReceiptWithTabscanner(
              file.buffer,
              file.originalname,
              file.mimetype
            );

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
