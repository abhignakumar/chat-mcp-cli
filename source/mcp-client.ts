import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class MCPClient {
    private mcp: Client;
    private httpTransport: StreamableHTTPClientTransport | null = null;
    private stdioTransport: StdioClientTransport | null = null;

    constructor() {
        this.mcp = new Client({ name: "mcp-client", version: "1.0.0" });
    }

    async connectToServer(url: string, headers?: Record<string, string>) {
        try {
            this.httpTransport = new StreamableHTTPClientTransport(new URL(url), {
                requestInit: {
                    headers: headers,
                },
            });
            await this.mcp.connect(this.httpTransport);
        } catch (e) {
            throw e;
        }
    }

    async connectToLocalServer(command: string, args?: string[], env?: Record<string, string>) {
        try {
            this.stdioTransport = new StdioClientTransport({ command, args, env });
            await this.mcp.connect(this.stdioTransport);
        } catch (e) {
            throw e;
        }
    }

    async listTools() {
        return await this.mcp.listTools();
    }

    async callTool(toolName: string, args?: Record<string, unknown>) {
        return await this.mcp.callTool({ name: toolName, arguments: args });
    }

    async disconnect() {
        await this.mcp.close();
    }
}