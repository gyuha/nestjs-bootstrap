"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemConnector = void 0;
const common_1 = require("@nestjs/common");
const fs = require("node:fs");
const path = require("node:path");
const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.pdf', '.docx'];
let FileSystemConnector = class FileSystemConnector {
    supports(source) {
        return source === 'filesystem';
    }
    async fetch(sourcePath) {
        const documents = [];
        const stat = await fs.promises.stat(sourcePath);
        if (stat.isDirectory()) {
            await this.fetchDirectory(sourcePath, documents);
        }
        else if (stat.isFile()) {
            const doc = await this.readFile(sourcePath);
            if (doc)
                documents.push(doc);
        }
        return documents;
    }
    async fetchDirectory(dirPath, documents) {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                await this.fetchDirectory(fullPath, documents);
            }
            else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (SUPPORTED_EXTENSIONS.includes(ext)) {
                    const doc = await this.readFile(fullPath);
                    if (doc)
                        documents.push(doc);
                }
            }
        }
    }
    async readFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const ext = path.extname(filePath).toLowerCase();
            return {
                id: crypto.randomUUID(),
                source: 'filesystem',
                sourcePath: filePath,
                content: content,
                metadata: {
                    extension: ext,
                    fileName: path.basename(filePath),
                    fileSize: (await fs.promises.stat(filePath)).size,
                },
            };
        }
        catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return null;
        }
    }
};
exports.FileSystemConnector = FileSystemConnector;
exports.FileSystemConnector = FileSystemConnector = __decorate([
    (0, common_1.Injectable)()
], FileSystemConnector);
//# sourceMappingURL=file-system.connector.js.map