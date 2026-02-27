import express from 'express';
import dotenv from 'dotenv';
import commandRoutes from "./routes/commandRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import projectionRoutes from "./routes/projectionRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 8080;

app.use(express.json());

app.get('/health',(req,res)=>{
    res.status(200).json({status:'ok'});
});

app.get("/",(req,res)=>{
    res.json({message:"Bank ES/CQRS API is running"});
});

app.use("/api", commandRoutes);
app.use("/api", queryRoutes);
app.use("/api", projectionRoutes);

app.listen(PORT,()=>{
    console.log(`🚀 Server running on port ${PORT}`);
})