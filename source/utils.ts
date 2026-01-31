import fs from "fs";
import { MCPConfigSchema, TMCPConfig, ConfigSchema, TConfig } from "./types.js";
import path from "path";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

export function readMCPConfig(): TMCPConfig | null {
    const mcpFilePath = path.join(process.cwd(), "mcp.json");
    if (!fs.existsSync(mcpFilePath)) {
        console.log("MCP config file not found: ", mcpFilePath);
        return null;
    }
    let mcpConfig: TMCPConfig;
    try {
        const mcpConfigData = JSON.parse(fs.readFileSync(mcpFilePath, "utf-8"));
        const validConfig = MCPConfigSchema.safeParse(mcpConfigData);
        if (!validConfig.success) {
            console.log("Invalid MCP config file: ", validConfig.error);
            return null;
        }
        mcpConfig = validConfig.data;
    } catch (e) {
        console.log("Failed to read MCP config file: ", e);
        return null;
    }
    return mcpConfig;
}

export function readConfig(): TConfig | null {
    const configFilePath = path.join(process.cwd(), "config.json");
    if (!fs.existsSync(configFilePath)) {
        console.log("Config file not found: ", configFilePath);
        return null;
    }
    let config: TConfig;
    try {
        const configData = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
        const validConfig = ConfigSchema.safeParse(configData);
        if (!validConfig.success) {
            console.log("Invalid config file: ", validConfig.error);
            return null;
        }
        config = validConfig.data;
    } catch (e) {
        console.log("Failed to read config file: ", e);
        return null;
    }
    return config;
}

export function getAISDKModel(config: TConfig): LanguageModel {
    switch (config.apiProvider) {
        case "openai":
            return createOpenAI({
                apiKey: config.apiKey,
            }).chat(config.model);
        case "anthropic":
            return createAnthropic({
                apiKey: config.apiKey,
            }).chat(config.model);
        case "google":
            return createGoogleGenerativeAI({
                apiKey: config.apiKey,
            }).chat(config.model);
        case "openrouter":
            return createOpenRouter({
					apiKey: config.apiKey,
				}).chat(config.model);
    }
}

export function isValidJson(str: string): boolean {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
