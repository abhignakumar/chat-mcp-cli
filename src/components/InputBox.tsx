import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface InputBoxProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    placeholder?: string;
}

export default function InputBox({
    value,
    onChange,
    onSubmit,
    placeholder = 'Type your message...',
}: InputBoxProps) {
    return (
        <Box flexDirection="column" width={"100%"}>
            <Box borderStyle={"single"} borderLeft={false} borderRight={false} borderDimColor>
                <Text dimColor>&gt; </Text>
                <TextInput
                    value={value}
                    onChange={onChange}
                    onSubmit={onSubmit}
                    placeholder={placeholder}
                    showCursor
                />
            </Box>
        </Box>
    );
}
