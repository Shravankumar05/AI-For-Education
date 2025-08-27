"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cors_1 = require("cors");
const flashcard_1 = require("./routes/flashcard");
const app = (0, express_1.default)();
const port = 5005;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/flashcards', flashcard_1.default);
app.listen(port, () => {
    console.log(`Flashcard service listening at http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map