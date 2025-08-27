/**
 * Process text content and generate embeddings using nomic-embed-text
 */
export declare const generateEmbeddings: (text: string) => Promise<number[]>;
/**
 * Extract text content from a PDF file
 */
export declare const extractTextFromPDF: (filePath: string) => Promise<string>;
/**
 * Process uploaded file and extract its content based on file type
 */
export declare const processFile: (filePath: string) => Promise<string>;
//# sourceMappingURL=embeddings.d.ts.map