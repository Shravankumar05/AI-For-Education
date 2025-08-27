"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const flashcard_1 = __importDefault(require("./routes/flashcard"));
const app = (0, express_1.default)();
const port = 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_edu';
mongoose_1.default.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));
app.use('/api/flashcards', flashcard_1.default);
app.listen(port, () => {
    console.log(`Flashcard service listening at http://localhost:${port}`);
});
