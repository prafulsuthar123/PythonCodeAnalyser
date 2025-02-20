import { codeAnalysis, type CodeAnalysis, type InsertCodeAnalysis } from "@shared/schema";

export interface IStorage {
  saveAnalysis(analysis: InsertCodeAnalysis): Promise<CodeAnalysis>;
  getAnalysis(id: number): Promise<CodeAnalysis | undefined>;
}

export class MemStorage implements IStorage {
  private analyses: Map<number, CodeAnalysis>;
  private currentId: number;

  constructor() {
    this.analyses = new Map();
    this.currentId = 1;
  }

  async saveAnalysis(analysis: InsertCodeAnalysis): Promise<CodeAnalysis> {
    const id = this.currentId++;
    const newAnalysis: CodeAnalysis = { ...analysis, id };
    this.analyses.set(id, newAnalysis);
    return newAnalysis;
  }

  async getAnalysis(id: number): Promise<CodeAnalysis | undefined> {
    return this.analyses.get(id);
  }
}

export const storage = new MemStorage();
