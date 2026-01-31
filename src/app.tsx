import { useEffect, useState } from 'react';
import { Box, Text, useApp, useStdout } from 'ink';
import { getAISDKModel, isValidJson, readConfig, readMCPConfig } from './utils.js';
import { MCPClient } from './mcp-client.js';
import { FilePart, ImagePart, JSONValue, ModelMessage, streamText, TextPart, ToolResultPart } from 'ai';
import InputBox from './components/InputBox.js';
import WelcomeScreen from './components/WelcomeScreen.js';
import { jsonSchema } from 'ai';
import { TConfig } from './types.js';
import Spinner from 'ink-spinner';

globalThis.AI_SDK_LOG_WARNINGS = false;

export default function App() {
	const [mcpClients, setMcpClients] = useState<Map<string, MCPClient>>(new Map());
	const [_, setTools] = useState<Map<string, string[]>>(new Map());
	const [loading, setLoading] = useState(true);
	const [prompt, setPrompt] = useState('');
	const [messages, setMessages] = useState<ModelMessage[]>([]);
	const [streamMessage, setStreamMessage] = useState<string>('');
	const [config, setConfig] = useState<TConfig>();
	const [agentActive, setAgentActive] = useState(false);
	const { exit } = useApp();
	const { write } = useStdout();

	async function connectToMCPServers() {
		const mcpConfig = readMCPConfig();
		if (!mcpConfig) {
			exit();
			process.exit(1);
		}

		for (const [serverName, serverConfig] of Object.entries(mcpConfig.servers)) {
			if (serverConfig.disabled) continue;
			if (serverConfig.type === 'stdio') {
				const mcpClient = new MCPClient();
				if (!serverConfig.command) {
					write('Command not found for server: ' + serverName + '\n');
					continue;
				}
				try {
					await mcpClient.connectToLocalServer(serverConfig.command, serverConfig.args, serverConfig.env);
					const tools = (await mcpClient.listTools()).tools.map(tool => tool.name);
					setTools((prev) => new Map(prev).set(serverName, tools));
					setMcpClients((prev) => new Map(prev).set(serverName, mcpClient));
				} catch (e) {
					throw e;
				}
			} else if (serverConfig.type === 'http') {
				const mcpClient = new MCPClient();
				if (!serverConfig.url) {
					write('URL not found for server: ' + serverName + '\n');
					continue;
				}
				try {
					await mcpClient.connectToServer(serverConfig.url, serverConfig.headers);
					const tools = (await mcpClient.listTools()).tools.map(tool => tool.name);
					setTools((prev) => new Map(prev).set(serverName, tools));
					setMcpClients((prev) => new Map(prev).set(serverName, mcpClient));
				} catch (e) {
					throw e;
				}
			} else if (serverConfig.type === 'sse') {
				const mcpClient = new MCPClient();
				if (!serverConfig.url) {
					write('URL not found for server: ' + serverName + '\n');
					continue;
				}
				try {
					await mcpClient.connectToServer(serverConfig.url, serverConfig.headers);
					const tools = (await mcpClient.listTools()).tools.map(tool => tool.name);
					setTools((prev) => new Map(prev).set(serverName, tools));
					setMcpClients((prev) => new Map(prev).set(serverName, mcpClient));
				} catch (e) {
					throw e;
				}
			}
		}
	}

	async function handlePrompt() {
		if (!prompt.trim()) return;

		if (prompt === '/exit' || prompt === '/quit') {
			await disconnectAllClients();
			exit();
			process.exit(0);
		}

		setAgentActive(true);

		const newMessages = [...messages, { role: 'user', content: [{ type: "text", text: prompt }] } as ModelMessage];
		setMessages(() => [...newMessages]);
		setPrompt('');

		let fetchedTools: Record<string, any> = {};
		for (const [serverName, mcpClient] of mcpClients.entries()) {
			const mcpTools = await mcpClient.listTools();
			const tempTools = mcpTools.tools.reduce((acc, tool) => {
				acc[`mcp__${serverName}__${tool.name}`] = {
					description: tool.description,
					inputSchema: jsonSchema(tool.inputSchema)
				};
				return acc;
			}, {} as Record<string, any>);
			fetchedTools = { ...fetchedTools, ...tempTools };
		}

		let hasToolCall: boolean;
		do {
			hasToolCall = false;
			const result = streamText({
				model: getAISDKModel(config!),
				messages: newMessages,
				tools: fetchedTools
			});
			for await (const chunk of result.fullStream) {
				switch (chunk.type) {
					case "reasoning-start":
						break;
					case "reasoning-delta":
						break;
					case "reasoning-end":
						break;
					case "text-start":
						setStreamMessage('');
						break;
					case "text-delta":
						setStreamMessage((prev) => prev + chunk.text);
						break;
					case 'text-end':
						setStreamMessage('');
						break;
					case "tool-input-start":
						break;
					case 'tool-input-delta':
						break;
					case "tool-input-end":
						break;
					case "tool-call":
						break;
				}
			}
			const modelMessages = (await result.response).messages;
			const toolCalls = await result.toolCalls;
			hasToolCall = toolCalls.length > 0;
			setMessages((prev) => [...prev, ...modelMessages]);
			newMessages.push(...modelMessages);
			for (const toolCall of toolCalls) {
				const toolResult = await mcpClients.get(toolCall.toolName.split('__')[1] ?? '')?.callTool(toolCall.toolName.split('__')[2] ?? '', toolCall.input as Record<string, unknown>);
				const toolResponse: ModelMessage = {
					role: "tool",
					content: [
						{
							type: "tool-result",
							toolCallId: toolCall.toolCallId,
							toolName: toolCall.toolName,
							output: toolResult ? (toolResult.structuredContent ? {
								type: 'json',
								value: toolResult.structuredContent as JSONValue,
							} : (Array.isArray(toolResult.content) ? {
								type: isValidJson(toolResult.content.find((item) => item.type === 'text')?.text) ? 'json' : 'text',
								value: isValidJson(toolResult.content.find((item) => item.type === 'text')?.text) ? JSON.parse(toolResult.content.find((item) => item.type === 'text')?.text) as JSONValue : toolResult.content.find((item) => item.type === 'text')?.text,
							} : {
								type: 'text',
								value: typeof toolResult.content === 'string' ? toolResult.content : JSON.stringify(toolResult.content),
							})) : {
								type: 'text',
								value: 'Tool call failed',
							},
						}
					]
				}
				setMessages((prev) => [...prev, toolResponse])
				newMessages.push(toolResponse);
			}
		} while (hasToolCall);

		setAgentActive(false);
	}

	const disconnectAllClients = async () => {
		for (const [_, mcpClient] of mcpClients)
			await mcpClient.disconnect();
	};

	useEffect(() => {
		setLoading(true);
		const configDetailes = readConfig();
		if (!configDetailes) {
			write('Config file not found/Invalid config file\n');
			exit();
			process.exit(1);
		}
		setConfig(configDetailes);
		connectToMCPServers().then(() => {
			setLoading(false);
		}).catch(async (e) => {
			write('Failed to connect to MCP servers: ' + JSON.stringify(e) + '\n');
			await disconnectAllClients();
			exit();
		})
	}, []);

	if (loading)
		return <Text>Connecting to MCP servers...</Text>;

	const extractTextForUserMessage = (content: Array<TextPart | ImagePart | FilePart>) => {
		return content
			.filter((part) => part.type === 'text')
			.map(part => part.text)
			.join('\n\n');
	};

	return (
		<Box flexDirection="column" padding={2} width="100%">
			<WelcomeScreen
				mcpServers={Array.from(mcpClients.keys())}
				modelName={config!.model}
			/>

			<Box flexDirection="column" width="100%">
				{messages.map((message, msgIndex) => {
					if (message.role === 'user') {
						return (
							<Box key={msgIndex} marginBottom={1}>
								<Text dimColor>
									&gt; {typeof message.content === 'string' ? message.content : extractTextForUserMessage(message.content)}
								</Text>
							</Box>
						);
					} else if (message.role === 'assistant') {
						return (
							<Box key={msgIndex} flexDirection="column" marginBottom={1}>
								{Array.isArray(message.content) ? message.content.map((part, index) => {
									if (part.type === 'text') {
										return <Text key={index}>
											{String.fromCodePoint(0x25CF)} {part.text}
										</Text>;
									} else if (part.type === 'tool-call') {
										let tempIndex = msgIndex
										let toolResult: ToolResultPart | undefined
										while (tempIndex < messages.length && messages[tempIndex]?.role !== 'user') {
											const msg = messages[tempIndex]
											if (msg?.role === "tool") {
												const tempToolResult = msg.content.find((c) => c.type === 'tool-result' && c.toolCallId === part.toolCallId)
												if (tempToolResult) {
													toolResult = tempToolResult as ToolResultPart;
													break;
												}
											}
											tempIndex++;
										}
										return (
											<Box key={index} flexDirection="column">
												<Text bold>
													{String.fromCodePoint(0x25CF)} {part.toolName} ({Object.entries(part.input as Record<string, unknown>).map(([key, value]) => `${key}: ${value}`).join(', ')})
												</Text>
												{toolResult && <Text>
													{String.fromCodePoint(0x2514, 0x2500, 0x2500) + " "}
													<Text dimColor>
														{toolResult.output.type === 'text' ? toolResult.output.value : toolResult.output.type === "json" ? JSON.stringify(toolResult.output.value, null, 2) : "Some result"}
													</Text>
												</Text>}
											</Box>)
									}
									return null;
								}) : <Text>
									{String.fromCodePoint(0x25CF)} {message.content}
								</Text>
								}
							</Box>
						);
					}
					return null;
				})}

				{streamMessage !== '' && (
					<Text>
						{String.fromCodePoint(0x25CF)} {streamMessage}
					</Text>
				)}
				{agentActive && (
					<Box paddingY={1}>
						<Text color={"#b37e6f"}>
							<Spinner /> {streamMessage !== '' ? "Streaming..." : "Loading..."}
						</Text>
					</Box>
				)}
			</Box>

			<InputBox
				value={prompt}
				onChange={setPrompt}
				onSubmit={handlePrompt}
			/>
			<Text dimColor>Type '/exit' to exit</Text>
		</Box>
	);
}