import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import secretRouter from "./routes/secret.js";

const app = express();

// 1. TRUST PROXY (Required for Rate Limiting on Render/Vercel)
app.set("trust proxy", 1);

// 2. STRICT SECURITY HEADERS (Recommendation #1)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], 
      scriptSrc: ["'self'"], // No external scripts allowed
      objectSrc: ["'none'"], // No <object> tags
      upgradeInsecureRequests: [], // Force HTTPS
    },
  },
  crossOriginResourcePolicy: { policy: "same-origin" }, // Blocks other sites from loading your resources
  referrerPolicy: { policy: "no-referrer" }, // Don't leak URLs
}));

// 3. STRICT CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://secure-secrets.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// 4. PAYLOAD LIMITS (Prevent DoS)
app.use(express.json({ limit: "20mb" })); // Reduced from 250mb since PDF is now client-side
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// 5. GLOBAL RATE LIMITER
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Global limit per IP
  message: { error: "too_many_requests" }
});
app.use(limiter);

// ROUTES
app.use("/api/secrets", secretRouter);
app.get("/_health", (req, res) => res.send("ok"));

// 6. HARDENED GLOBAL ERROR HANDLER (Recommendation #3)
// This catches ANY crash in the app and returns a generic JSON
app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err.stack); // Log internally
  // Send generic message to user
  res.status(500).json({ error: "internal_error" });
});

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI, { dbName: "secretsdb" })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log("Server running on " + PORT));
  })
  .catch((err) => {
    console.error("MongoDB connection error");
    process.exit(1);
  });