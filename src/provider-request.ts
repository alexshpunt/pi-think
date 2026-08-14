import { TOOL_NAME } from "./constants.js";

export function forceThinkRequest(
    payloadValue: unknown,
    api: string,
    reasoningPrompt: string,
): Record<string, unknown> | undefined
{
    if (!isRecord(payloadValue))
    {
        return undefined;
    }

    if (api === "google-generative-ai" || api === "google-vertex")
    {
        return forceGoogleThink(payloadValue, reasoningPrompt);
    }

    if (!Array.isArray(payloadValue.tools))
    {
        return undefined;
    }

    const tools: unknown[] = payloadValue.tools;

    if (!tools.some((tool) => hasToolName(tool, TOOL_NAME)))
    {
        return undefined;
    }

    // Keep every tool definition in the request. Provider caches and continuation
    // transports may otherwise carry the narrowed schema into the following turn.
    if (api === "anthropic-messages")
    {
        const system = appendPrompt(payloadValue.system, reasoningPrompt);
        return {
            ...payloadValue,
            system,
            tool_choice: { type: "tool", name: TOOL_NAME, disable_parallel_tool_use: true },
        };
    }

    if (api === "openai-completions")
    {
        return {
            ...payloadValue,
            messages: appendChatPrompt(payloadValue.messages, reasoningPrompt),
            tool_choice: { type: "function", function: { name: TOOL_NAME } },
            parallel_tool_calls: false,
        };
    }

    if (typeof payloadValue.instructions !== "string")
    {
        return undefined;
    }

    const instructions = appendPrompt(payloadValue.instructions, reasoningPrompt);
    return {
        ...payloadValue,
        instructions,
        tool_choice: { type: "function", name: TOOL_NAME },
        parallel_tool_calls: false,
    };
}

function forceGoogleThink(
    payload: Record<string, unknown>,
    reasoningPrompt: string,
): Record<string, unknown> | undefined
{
    const config = isRecord(payload.config) ? payload.config : {};
    const tools: unknown[] = Array.isArray(config.tools) ? config.tools : [];

    if (!tools.some((tool) => hasToolName(tool, TOOL_NAME)))
    {
        return undefined;
    }

    return {
        ...payload,
        config: {
            ...config,
            systemInstruction: appendPrompt(config.systemInstruction, reasoningPrompt),
            toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [TOOL_NAME] } },
        },
    };
}

function appendPrompt(value: unknown, reasoningPrompt: string): string
{
    return typeof value === "string" ? `${value}\n\n${reasoningPrompt}` : reasoningPrompt;
}

function appendChatPrompt(value: unknown, reasoningPrompt: string): unknown[]
{
    const messages: unknown[] = Array.isArray(value) ? [...value] : [];

    for (let index = messages.length - 1; index >= 0; index -= 1)
    {
        const message = messages[index];

        if (
            isRecord(message)
            && (message.role === "system" || message.role === "developer")
            && typeof message.content === "string"
        )
        {
            messages[index] = {
                ...message,
                content: appendPrompt(message.content, reasoningPrompt),
            };
            return messages;
        }
    }

    return [{ role: "system", content: reasoningPrompt }, ...messages];
}

function hasToolName(tool: unknown, name: string): boolean
{
    if (toolName(tool) === name)
    {
        return true;
    }

    if (!isRecord(tool) || !Array.isArray(tool.functionDeclarations))
    {
        return false;
    }

    return tool.functionDeclarations.some(
        (declaration) => isRecord(declaration) && declaration.name === name,
    );
}

function toolName(tool: unknown): string | undefined
{
    if (!isRecord(tool))
    {
        return undefined;
    }

    if (typeof tool.name === "string")
    {
        return tool.name;
    }

    return isRecord(tool.function) && typeof tool.function.name === "string"
        ? tool.function.name
        : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown>
{
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
