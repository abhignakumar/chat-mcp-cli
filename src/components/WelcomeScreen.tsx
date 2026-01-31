import { TitledBox } from '@mishieck/ink-titled-box';
import { Box, Text } from 'ink';
import os from 'os';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

interface WelcomeScreenProps {
    mcpServers: string[];
    modelName?: string;
}

export default function WelcomeScreen({
    mcpServers,
    modelName = 'mistralai/devstral-2512:free'
}: WelcomeScreenProps) {
    const username = os.userInfo().username;
    const currentPath = process.cwd();

    return (
        <Box flexDirection="column">
            <TitledBox
                titles={["Chat MCP CLI"]}
                borderStyle="round"
                borderColor="#b37e6f"
                flexDirection="column"
                paddingX={2}
                marginBottom={1}
            >
                <Box>
                    <Box flexDirection="column" width="60%"
                        margin={1}
                        borderStyle="single"
                        borderColor="#b37e6f"
                        borderLeft={false}
                        borderTop={false}
                        borderBottom={false}
                    >
                        <Box
                            justifyContent="center"
                        >
                            <Text bold>Welcome back {username}!</Text>
                        </Box>
                        <Box flexDirection="column" alignItems="center"
                        >
                            <Gradient name="atlas">
                                <BigText text="Chat MCP" />
                            </Gradient>
                        </Box>

                        <Box flexDirection="column" justifyContent="center">
                            <Box justifyContent="center">
                                <Text dimColor>{modelName}</Text>
                            </Box>
                            <Box justifyContent="center"
                            >
                                <Text dimColor>{currentPath}</Text>
                            </Box>
                        </Box>
                    </Box>
                    <Box flexDirection="column" width="40%">
                        <Box flexDirection="column"
                            margin={1}
                            borderStyle="single"
                            borderColor="#b37e6f"
                            borderLeft={false}
                            borderTop={false}
                            borderRight={false}
                        >
                            <Text bold color="#b37e6f">
                                Connected servers
                            </Text>
                            <Box flexDirection="column">
                                {mcpServers.length > 0 ? (
                                    mcpServers.slice(0, 3).map((server, i) => (
                                        <Text key={i} dimColor>
                                            {server}
                                        </Text>
                                    ))
                                ) : (
                                    <Text dimColor>No servers</Text>
                                )}
                            </Box>
                        </Box>
                        <Box flexDirection="column" margin={1}
                        >
                            <Text bold color="#b37e6f">
                                Quick tips
                            </Text>
                            <Box flexDirection="column">
                                <Text dimColor>Chat with any LLM</Text>
                                <Text dimColor>Connect MCP servers</Text>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </TitledBox >
        </Box >
    );
}
