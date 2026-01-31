import { z } from "zod";

export const MCPConfigSchema = z.object({
    servers: z.record(
        z.string(),
        z.object({
            type: z.enum(["stdio", "http", "sse"]),
            url: z.string().optional(),
            headers: z.record(z.string(), z.string()).optional(),
            command: z.string().optional(),
            args: z.array(z.string()).optional(),
            env: z.record(z.string(), z.string()).optional(),
            disabled: z.boolean().optional(),
            disabledTools: z.array(z.string()).optional(),
        })
    ),
});

export type TMCPConfig = z.infer<typeof MCPConfigSchema>;

export const ConfigSchema = z.object({
    apiProvider: z.enum(["openai", "anthropic", "google", "openrouter"]),
    model: z.string().min(1),
    apiKey: z.string().min(1),
});

export type TConfig = z.infer<typeof ConfigSchema>;