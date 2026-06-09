import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Gemini SDK Initialization
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/helper", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: "You are an expert helper assistant specialized in gigs, tasks, and digital wallets. Be concise, helpful, and professional.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error caught:", error);
    
    const errMessage = error.message || "";
    const isHighDemand = errMessage.includes("503") || 
                         errMessage.includes("demand") || 
                         errMessage.includes("UNAVAILABLE") || 
                         errMessage.includes("unavailable");

    const msgLower = message.toLowerCase();
    let fallbackText = "";

    if (isHighDemand) {
      fallbackText += "⚠️ **AI Assistant: High Demand Fallback Mode**\n\nOur primary Gemini 3.5 Flash engine is currently experiencing temporarily high demand (503 Service Unavailable). To avoid keeping you waiting, I have booted up our specialized offline guidance protocol to assist you instantly:\n\n";
    } else {
      fallbackText += "⚠️ **AI Assistant: Auxiliary Offline Mode**\n\nI couldn't contact my remote AI server (possibly due to connection limits or configuration). No worries! I have fetched specialized guide details for you based on your prompt:\n\n";
    }

    if (msgLower.includes("wallet") || msgLower.includes("pay") || msgLower.includes("withdraw") || msgLower.includes("deposit") || msgLower.includes("money") || msgLower.includes("balance") || msgLower.includes("cwallet")) {
      fallbackText += "### 💳 Digital Wallet & Payments\n" +
        "- **View Balance:** Click the **Cwallet** tab in the bottom menu to see your current funds, active profits, and transaction history.\n" +
        "- **Deposit/Withdraw:** You can top up your balance with standard presets or withdraw securely to any linked bank option.\n" +
        "- **Safety Features:** Transacted money is handled by our escrow contract. Funds are only transferred once you mark a gig as completed.";
    } else if (msgLower.includes("become") || msgLower.includes("helper") || msgLower.includes("profile") || msgLower.includes("list") || msgLower.includes("image") || msgLower.includes("portfolio")) {
      fallbackText += "### 🌟 Become a Helper\n" +
        "- **Setup Account:** Head over to the **Helper** tab and click **Become a Helper** or **Manage Helper Profile** at the top right.\n" +
        "- **Auto-Population:** Your profile display name, email contact, credentials, and experience list will automatically bind to your helper card.\n" +
        "- **Attraction Pictures:** Upload multiple high-quality portfolio images! Visual assets enhance trust and increase your hire probability by 4x.";
    } else if (msgLower.includes("gig") || msgLower.includes("task") || msgLower.includes("job") || msgLower.includes("post") || msgLower.includes("apply")) {
      fallbackText += "### 💼 Micro-Gigs Board\n" +
        "- **Browse Gigs:** Go to the **GiGs** tab to review open jobs, check requirements, and start task submissions.\n" +
        "- **Create custom gigs:** Publish a brand new task by clicking **Post a Gig**. Enter descriptions, set fixed budgets, and upload sample files.";
    } else {
      fallbackText += "### ℹ️ Core Workspace Guidance\n" +
        `- Regarding: "${message}"\n` +
        "- **Gigs Board:** Publish micro-jobs or manage open tasks.\n" +
        "- **Helper Directory:** Apply to become an interactive assistant instantly with image uploads, or hire top talent.\n" +
        "- **Cwallet Ledger:** Full accounting and financial monitoring panel.";
    }

    fallbackText += "\n\n*Please try sending your message again in a short moment once the high demand settles down!*";
    
    // Return the response as 200 with fallback text so we do not crash the chat flow
    res.json({ text: fallbackText });
  }
});

// Vite Middleware for Development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
