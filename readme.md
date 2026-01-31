# Chat MCP CLI

A beautiful command-line chat interface that connects to MCP (Model Context Protocol) servers and supports multiple AI providers. Chat with LLMs while leveraging the power of MCP tools directly from your terminal.

## Features

- 🤖 **Multiple AI Providers**: Support for OpenAI, Anthropic, Google, and OpenRouter
- 🔌 **MCP Server Integration**: Connect to any MCP-compatible server (stdio, HTTP, SSE)
- 🛠️ **Tool Calling**: Automatically invoke MCP tools during conversations
- 🎨 **Beautiful UI**: Terminal UI built with React and Ink
- 💬 **Interactive Chat**: Real-time streaming responses with tool execution display
- ⚙️ **Flexible Configuration**: JSON-based configuration for both AI providers and MCP servers

## Installation

```bash
# Clone the repository
git clone https://github.com/abhignakumar/chat-mcp-cli
cd chat-mcp-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run the application
npm start
```

## Configuration

The application requires two configuration files in your working directory:

### 1. AI Provider Configuration (`config.json`)

Configure your AI provider and model:

```json
{
	"apiProvider": "openai",
	"model": "gpt-5.2",
	"apiKey": "your-api-key"
}
```

**Supported Providers:**

- `openai` - OpenAI models (GPT-5.2, GPT-5.2-pro, etc.)
- `anthropic` - Anthropic models (Claude Opus 4.5, etc.)
- `google` - Google Gemini models
- `openrouter` - OpenRouter models

See `example-config.json` for a template.

### 2. MCP Server Configuration (`mcp.json`)

Configure your MCP servers:

```json
{
	"servers": {
		"github": {
			"type": "http",
			"url": "https://api.githubcopilot.com/mcp/",
			"headers": {
				"Authorization": "Bearer your-api-key"
			},
			"disabled": false
		},
		"local-server": {
			"type": "stdio",
			"command": "node",
			"args": ["server.js"],
			"env": {
				"API_KEY": "value"
			},
			"disabled": false
		}
	}
}
```

**Server Types:**

- `http` - HTTP-based MCP server
- `sse` - Server-Sent Events MCP server
- `stdio` - Local stdio-based MCP server

**Options:**

- `disabled` - Set to `true` to disable a server
- `disabledTools` - Array of tool names to disable

See `example-mcp.json` for a template.

## Usage

### Run the CLI

```bash
# From the project directory (with config.json and mcp.json in current directory)
npm start

# Or run the file directly
node dist/cli.js
```

### Commands

- Type your message and press Enter to chat
- Type `/exit` or `/quit` to exit the application

### Display

The CLI features:

- **Welcome Screen**: Shows connected MCP servers, current model, and working directory
- **Chat History**: Displays conversation with user messages and AI responses
- **Tool Execution**: Shows when tools are called and their results
- **Input Box**: Interactive text input at the bottom
- **Status Indicator**: Shows when the AI is processing or streaming

## Architecture

- **`source/cli.tsx`** - Entry point that renders the React app
- **`source/app.tsx`** - Main application component with chat logic and MCP integration
- **`source/mcp-client.ts`** - MCP client wrapper for connecting to servers
- **`source/utils.ts`** - Utility functions for configuration and AI model setup
- **`source/types.ts`** - TypeScript types and Zod validation schemas
- **`source/components/`** - React components for the terminal UI

## Dependencies

- [Ink](https://github.com/vadimdemedes/ink) - React for interactive command-line apps
- [@ai-sdk](https://sdk.vercel.ai/) - AI SDK for multiple providers
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol) - MCP Client SDK
- [Zod](https://github.com/colinhacks/zod) - Schema validation