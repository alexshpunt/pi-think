import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getAgentDir } from "@earendil-works/pi-coding-agent";

export type ThinkMode = "off" | "on";

export interface ThinkSettings
{
    readonly mode: ThinkMode;
}

const PACKAGE_DIRECTORY = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEFAULT_PROMPT_PATH = path.join(PACKAGE_DIRECTORY, "resources", "reasoning.md");
const OVERRIDE_PROMPT_PATH = path.join(getAgentDir(), "reasoning.override.md");
const SETTINGS_DIRECTORY = path.join(getAgentDir(), "pi-think.agent-state");
const SETTINGS_PATH = path.join(SETTINGS_DIRECTORY, "settings.json");

export async function loadSettings(): Promise<ThinkSettings>
{
    try
    {
        const value = JSON.parse(await readFile(SETTINGS_PATH, "utf8")) as unknown;

        if (isRecord(value) && (value.mode === "off" || value.mode === "on"))
        {
            return { mode: value.mode };
        }
    }
    catch
    {
        return { mode: "on" };
    }

    return { mode: "on" };
}

export async function loadReasoningPrompt(): Promise<string>
{
    try
    {
        return await readFile(OVERRIDE_PROMPT_PATH, "utf8");
    }
    catch (error)
    {
        if (!isRecord(error) || error.code !== "ENOENT")
        {
            throw error;
        }
    }

    return readFile(DEFAULT_PROMPT_PATH, "utf8");
}

export async function saveSettings(settings: ThinkSettings): Promise<void>
{
    await mkdir(SETTINGS_DIRECTORY, { recursive: true });
    await writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

function isRecord(value: unknown): value is Record<string, unknown>
{
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
