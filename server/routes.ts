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
    tip?: number;
    serviceCharges?: { amount: number }[];
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
  subTotal: number;
  serviceCharge: number;
  tip: number;
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

              const items = lineItems.map((item: TabscannerItem, index: number) => {
                let description = item.desc || item.description || `Item ${index + 1}`;
                let quantity = item.qty || item.quantity || 1;
                const lineTotal = item.lineTotal || 0;
                const unitPrice = item.price || 0;
                
                // Handle OCR concatenation errors (e.g., "1 6 Wings" becomes qty=16, desc="Wings" or "6 Wings")
                // Check if description starts with a number that might be part of a merged quantity
                const leadingQtyMatch = description.match(/^(\d+)\s+(.+)$/);
                if (leadingQtyMatch) {
                  const leadingNum = parseInt(leadingQtyMatch[1], 10);
                  const qtyStr = quantity.toString();
                  
                  // Case 1: qty=16 with desc="6 Wings" - the "6" in description matches end of qty "16"
                  // This means actual qty is 1 (from qty string minus the leading number)
                  if (quantity > 9 && qtyStr.endsWith(leadingNum.toString())) {
                    const actualQtyStr = qtyStr.slice(0, -leadingNum.toString().length);
                    quantity = actualQtyStr ? parseInt(actualQtyStr, 10) : 1;
                  }
                  // Case 2: qty=2 with desc="2 Chai Latte" - quantity is correct, just clean description
                  // (no change to quantity needed)
                  
                  // Clean description to remove the leading quantity/number
                  description = leadingQtyMatch[2];
                }
                
                // Try to infer quantity from lineTotal / unitPrice when qty is missing or 0
                // e.g., lineTotal=75, unitPrice=25 -> quantity should be 3
                if ((quantity <= 0 || quantity === 1) && unitPrice > 0 && lineTotal > unitPrice) {
                  const inferredQty = Math.round(lineTotal / unitPrice);
                  if (inferredQty > 1 && inferredQty <= 20 && Math.abs(inferredQty * unitPrice - lineTotal) < 0.01) {
                    quantity = inferredQty;
                  }
                }
                
                // Also check if description contains a price pattern like "25.00" and we can extract quantity
                const priceInDescMatch = description.match(/^(.+?)\s+(\d+\.?\d*)$/);
                if (priceInDescMatch && (quantity <= 0 || quantity === 1)) {
                  const descPart = priceInDescMatch[1];
                  const priceFromDesc = parseFloat(priceInDescMatch[2]);
                  if (priceFromDesc > 0 && lineTotal > priceFromDesc) {
                    const inferredQty = Math.round(lineTotal / priceFromDesc);
                    const diff = Math.abs(inferredQty * priceFromDesc - lineTotal);
                    if (inferredQty > 1 && inferredQty <= 20 && diff < 0.01) {
                      quantity = inferredQty;
                      description = descPart;
                    }
                  }
                }
                
                // If quantity is 0 or unreasonably high (> 20), default to 1
                if (quantity <= 0 || quantity > 20) {
                  quantity = 1;
                }
                
                return {
                  description,
                  price: lineTotal || unitPrice || 0,
                  quantity,
                };
              });

              const totalValue = resultData.total || resultData.subTotal || 0;
              const total = typeof totalValue === "string" ? parseFloat(totalValue) : totalValue;
              const subTotalValue = resultData.subTotal || 0;
              const subTotal = typeof subTotalValue === "string" ? parseFloat(subTotalValue) : subTotalValue;
              
              const itemsSum = items.reduce(
                (sum: number, item: { price: number }) => sum + item.price,
                0
              );
              
              // Calculate service charge from difference between total and subtotal/items
              let serviceCharge = 0;
              const tip = resultData.tip || 0;
              
              // If total is higher than subtotal, the difference is likely service charge/gratuity
              if (total > subTotal && subTotal > 0) {
                serviceCharge = total - subTotal;
              } else if (total > itemsSum) {
                // If total is higher than items sum, calculate service charge
                serviceCharge = total - itemsSum;
              }
              
              const currency = resultData.currencyCode || resultData.currency || "USD";

              resolve({
                items,
                total,
                subTotal: subTotal || itemsSum,
                serviceCharge,
                tip,
                currency,
              });
            } catch (pollError) {
              reject(pollError);
            }
          } else if (response.status === "done" && response.result) {
            const resultData = response.result;
            const lineItems = resultData.lineItems || [];

            const items = lineItems.map((item: TabscannerItem, index: number) => {
              let description = item.desc || item.description || `Item ${index + 1}`;
              let quantity = item.qty || item.quantity || 1;
              const lineTotal = item.lineTotal || 0;
              const unitPrice = item.price || 0;
              
              // Handle OCR concatenation errors
              const leadingQtyMatch = description.match(/^(\d+)\s+(.+)$/);
              if (leadingQtyMatch) {
                const leadingNum = parseInt(leadingQtyMatch[1], 10);
                const qtyStr = quantity.toString();
                
                if (quantity > 9 && qtyStr.endsWith(leadingNum.toString())) {
                  const actualQtyStr = qtyStr.slice(0, -leadingNum.toString().length);
                  quantity = actualQtyStr ? parseInt(actualQtyStr, 10) : 1;
                }
                description = leadingQtyMatch[2];
              }
              
              // Infer quantity from lineTotal / unitPrice
              if ((quantity <= 0 || quantity === 1) && unitPrice > 0 && lineTotal > unitPrice) {
                const inferredQty = Math.round(lineTotal / unitPrice);
                if (inferredQty > 1 && inferredQty <= 20 && Math.abs(inferredQty * unitPrice - lineTotal) < 0.01) {
                  quantity = inferredQty;
                }
              }
              
              // Extract quantity from price in description
              const priceInDescMatch = description.match(/^(.+?)\s+(\d+\.?\d*)$/);
              if (priceInDescMatch && (quantity <= 0 || quantity === 1)) {
                const descPart = priceInDescMatch[1];
                const priceFromDesc = parseFloat(priceInDescMatch[2]);
                if (priceFromDesc > 0 && lineTotal > priceFromDesc) {
                  const inferredQty = Math.round(lineTotal / priceFromDesc);
                  if (inferredQty > 1 && inferredQty <= 20 && Math.abs(inferredQty * priceFromDesc - lineTotal) < 0.01) {
                    quantity = inferredQty;
                    description = descPart;
                  }
                }
              }
              
              if (quantity <= 0 || quantity > 20) {
                quantity = 1;
              }
              
              return {
                description,
                price: lineTotal || unitPrice || 0,
                quantity,
              };
            });

            const totalValue = resultData.total || resultData.subTotal || 0;
            const total = typeof totalValue === "string" ? parseFloat(totalValue) : totalValue;
            const subTotalValue = resultData.subTotal || 0;
            const subTotal = typeof subTotalValue === "string" ? parseFloat(subTotalValue) : subTotalValue;
            
            const itemsSum = items.reduce(
              (sum: number, item: { price: number }) => sum + item.price,
              0
            );
            
            let serviceCharge = 0;
            const tip = resultData.tip || 0;
            
            if (total > subTotal && subTotal > 0) {
              serviceCharge = total - subTotal;
            } else if (total > itemsSum) {
              serviceCharge = total - itemsSum;
            }
            
            const currency = resultData.currencyCode || resultData.currency || "USD";

            resolve({
              items,
              total,
              subTotal: subTotal || itemsSum,
              serviceCharge,
              tip,
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
  subTotal: number;
  serviceCharge: number;
  tip: number;
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

  const subTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    items: items.map((item) => ({
      ...item,
      price: item.price * item.quantity,
    })),
    total: subTotal,
    subTotal,
    serviceCharge: 0,
    tip: 0,
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
