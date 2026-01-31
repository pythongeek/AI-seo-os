import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

const embeddingModel = openai.embedding("text-embedding-3-small");

/**
 * Generate a single embedding for a string.
 */
export const generateEmbedding = async (value: string): Promise<number[]> => {
    // Sanitize input: replace newlines to optimize token usage
    const input = value.replace(/\n/g, " ");

    const { embedding } = await embed({
        model: embeddingModel,
        value: input,
    });

    return embedding;
};

/**
 * Generate embeddings for multiple strings in batch.
 */
export const generateEmbeddings = async (values: string[]): Promise<number[][]> => {
    const { embeddings } = await embedMany({
        model: embeddingModel,
        values: values.map(v => v.replace(/\n/g, " ")),
    });

    return embeddings;
};
