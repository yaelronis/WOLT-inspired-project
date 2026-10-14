// @ts-check
import mongoose from "mongoose";

// In docker compose the host is the "mongo" service name. locally it's 127.0.0.1.
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/biu";

/** Connect once at startup (call before app.listen). */
export async function connect_db() {
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");
}