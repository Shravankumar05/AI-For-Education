"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const dotenv_1 = require("dotenv");
const mongodb_memory_server_1 = require("mongodb-memory-server");
dotenv_1.default.config();
let mongoServer;
const connectDB = async () => {
    try {
        // Use in-memory MongoDB for development
        if (process.env.NODE_ENV === 'development') {
            mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            console.log(`Using MongoDB Memory Server at ${mongoUri}`);
            await mongoose_1.default.connect(mongoUri);
        }
        else {
            // Use real MongoDB connection for production
            const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-education';
            await mongoose_1.default.connect(MONGODB_URI);
        }
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=db.js.map