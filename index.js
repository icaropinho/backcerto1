import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import sessionRoutes from "./routes/sessions.js";

dotenv.config();
const app = express();

app.disable("x-powered-by");

app.use(cors());
app.use(express.json());

// headers de segurança e cache
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=3600");
  next();
});

app.use("/api/sessions", sessionRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB conectado");
    app.listen(process.env.PORT, () => {
      console.log(`Servidor rodando na porta ${process.env.PORT}`);
    });
  })
  .catch((err) => console.error("Erro na conexão com MongoDB:", err));
