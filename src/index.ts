import {
    type ExtensionAPI,
    getSettingsListTheme,
} from "@earendil-works/pi-coding-agent";
import {
    Container,
    type SettingItem,
    SettingsList,
    Text,
} from "@earendil-works/pi-tui";
import { Type } from "typebox";

import { TOOL_NAME } from "./constants.js";
import { forceThinkRequest } from "./provider-request.js";
import { ThinkPanel } from "./rendering.js";
import {
    loadReasoningPrompt,
    loadSettings,
    saveSettings,
    type ThinkMode,
} from "./storage.js";

export default async function registerThink(pi: ExtensionAPI): Promise<void>
{
    const [settings, reasoningPrompt] = await Promise.all([
        loadSettings(),
        loadReasoningPrompt(),
    ]);
    let mode = settings.mode;
    let forcedThink: false | "initial" | "after-tool" = false;

    pi.registerTool({
        renderShell: "self",
        name: TOOL_NAME,
        label: TOOL_NAME,
        description:
            "Private scratchpad for working out intent, assumptions, ambiguity, alternatives, consequences, or multi-step reasoning before continuing. Useful when a literal reading may miss what the user actually wants or when choosing between plausible actions.",
        parameters: Type.Object({
            thought: Type.String({
                description:
                    "Your reasoning. Work out the intended outcome, relevant constraints and assumptions, competing interpretations or approaches, and what should follow from them.",
            }),
        }, { additionalProperties: false }),
        execute()
        {
            forcedThink = false;
            return Promise.resolve({
                content: [{ type: "text" as const, text: "Reasoning recorded. Continue from these conclusions." }],
                details: {},
            });
        },
        renderCall(args, theme, context)
        {
            const thought = typeof args.thought === "string" ? args.thought : "";
            return new ThinkPanel(thought, context.expanded, theme);
        },
        renderResult()
        {
            return new Container();
        },
    });

    pi.on("before_agent_start", (_event, ctx) =>
    {
        const nativeReasoningCanBeDisabled = !ctx.model?.reasoning
            || ctx.model.thinkingLevelMap?.off !== null;
        forcedThink = mode === "on"
            && ctx.thinkingLevel === "off"
            && nativeReasoningCanBeDisabled
            ? "initial"
            : false;
    });

    pi.on("turn_end", (event, ctx) =>
    {
        if (
            mode === "on"
            && ctx.thinkingLevel === "off"
            && ctx.model !== undefined
            && ctx.model.thinkingLevelMap?.off !== null
            // Codex Responses can keep one response alive indefinitely when a
            // post-tool continuation is forced to reason again. Keep the safe
            // initial pass, but do not rewrite Codex continuation requests.
            && ctx.model.api !== "openai-codex-responses"
            && event.toolResults.some((result) => result.toolName !== TOOL_NAME)
        )
        {
            forcedThink = "after-tool";
        }
    });

    pi.on("before_provider_request", (event, ctx) =>
    {
        const model = ctx.model;

        if (
            mode !== "on"
            || !forcedThink
            || ctx.thinkingLevel !== "off"
            || model === undefined
            || model.thinkingLevelMap?.off === null
        )
        {
            return;
        }

        const payload = forceThinkRequest(event.payload, model.api, reasoningPrompt);
        // Consume the latch before the request is sent. A forced reasoning pass
        // is one-shot; retries or repeated provider hooks must not create a loop.
        forcedThink = false;

        return payload;
    });

    pi.on("agent_end", () =>
    {
        forcedThink = false;
    });

    pi.on("agent_settled", () =>
    {
        forcedThink = false;
    });

    pi.on("session_start", (_event, ctx) =>
    {
        applyMode(pi, mode, ctx.model?.thinkingLevelMap?.off !== null);
    });

    pi.on("model_select", (event, ctx) =>
    {
        const supported = event.model.thinkingLevelMap?.off !== null;
        applyMode(pi, mode, supported);
        forcedThink = false;

        if (mode === "on" && !supported)
        {
            ctx.ui.notify("Native reasoning cannot be disabled for this model", "warning");
        }
    });

    pi.on("thinking_level_select", (event, ctx) =>
    {
        applyMode(pi, mode, event.level === "off" && ctx.model?.thinkingLevelMap?.off !== null);
        forcedThink = false;
    });

    pi.registerCommand("think", {
        description: "Choose when the think tool is required",
        handler: async (_args, ctx) =>
        {
            if (ctx.mode !== "tui")
            {
                ctx.ui.notify("/think requires TUI mode", "error");
                return;
            }

            const items: SettingItem[] = [{
                id: TOOL_NAME,
                label: "Think mode",
                currentValue: mode,
                values: ["off", "on"],
            }];

            await ctx.ui.custom<null>((tui, theme, _keybindings, done) =>
            {
                const container = new Container();
                container.addChild(new Text(theme.fg("accent", theme.bold("Think Settings")), 1, 1));

                const settingsList = new SettingsList(
                    items,
                    3,
                    getSettingsListTheme(),
                    (_id: string, value: string) =>
                    {
                        mode = value as ThinkMode;

                        if (mode === "off")
                        {
                            forcedThink = false;
                        }

                        applyMode(
                            pi,
                            mode,
                            ctx.thinkingLevel === "off" && ctx.model?.thinkingLevelMap?.off !== null,
                        );
                        void saveSettings({ mode }).catch((error: unknown) =>
                        {
                            const message = error instanceof Error ? error.message : String(error);
                            ctx.ui.notify(`Could not save think settings: ${message}`, "error");
                        });
                    },
                    () =>
                    {
                        done(null);
                    },
                );

                container.addChild(settingsList);
                return {
                    render: (width: number) => container.render(width),
                    invalidate: () =>
                    {
                        container.invalidate();
                    },
                    handleInput: (data: string) =>
                    {
                        settingsList.handleInput(data);
                        tui.requestRender();
                    },
                };
            });
        },
    });
}

function applyMode(pi: ExtensionAPI, mode: ThinkMode, supported: boolean): void
{
    const activeTools = pi.getActiveTools().filter((name) => name !== TOOL_NAME);
    pi.setActiveTools(mode === "on" && supported ? [...activeTools, TOOL_NAME] : activeTools);
}
