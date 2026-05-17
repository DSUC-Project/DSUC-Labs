import dotenv from "dotenv";
import path from "path";

const localEnvPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: localEnvPath });
dotenv.config();
