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

    if (api === "google-generative-ai")
    {
        return forceGoogleThink(payloadValue, reasoningPrompt);
    }

    if (!Array.isArray(payloadValue.tools))
    {
        return undefined;
    }

    const tools: unknown[] = payloadValue.tools;
    const thinkTool: unknown = tools.find((tool) => toolName(tool) === TOOL_NAME);

    if (thinkTool === undefined)
    {
        return undefined;
    }

    if (api === "anthropic-messages")
    {
        const system = appendPrompt(payloadValue.system, reasoningPrompt);
        return {
            ...payloadValue,
            system,
            tools: [thinkTool],
            tool_choice: { type: "tool", name: TOOL_NAME, disable_parallel_tool_use: true },
        };
    }

    const instructions = appendPrompt(payloadValue.instructions, reasoningPrompt);
    return {
        ...payloadValue,
        instructions,
        tools: [thinkTool],
        tool_choice: "required",
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
    const thinkTool: unknown = tools.find((tool) => toolName(tool) === TOOL_NAME);

    if (thinkTool === undefined)
    {
        return undefined;
    }

    return {
        ...payload,
        config: {
            ...config,
            systemInstruction: appendPrompt(config.systemInstruction, reasoningPrompt),
            tools: [thinkTool],
            toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [TOOL_NAME] } },
        },
    };
}

function appendPrompt(value: unknown, reasoningPrompt: string): string
{
    return typeof value === "string" ? `${value}\n\n${reasoningPrompt}` : reasoningPrompt;
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
