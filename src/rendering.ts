import { getMarkdownTheme, keyHint, type Theme } from "@earendil-works/pi-coding-agent";
import { type Component, Markdown, truncateToWidth } from "@earendil-works/pi-tui";

const COMPACT_THINK_ROWS = 12;

export class ThinkPanel implements Component
{
    public constructor(
        private readonly thought: string,
        private readonly expanded: boolean,
        private readonly theme: Theme,
    )
    {}

    public render(width: number): string[]
    {
        const outputPad = width > 1 ? 1 : 0;
        const contentWidth = Math.max(1, width - outputPad);
        const thought = this.thought.trim();

        if (thought.length === 0)
        {
            return [];
        }

        const markdown = new Markdown(thought, 0, 0, getMarkdownTheme(), {
            color: (text) => this.theme.fg("thinkingText", text),
            italic: true,
        });
        const renderedRows = markdown.render(contentWidth);
        const rows = compactThoughtRows(renderedRows, this.expanded, this.theme);
        const padding = " ".repeat(outputPad);

        return rows.map((row) => truncateToWidth(`${padding}${row}`, width, ""));
    }

    public invalidate(): void
    {}
}

function compactThoughtRows(rows: readonly string[], expanded: boolean, theme: Theme): readonly string[]
{
    if (expanded || rows.length <= COMPACT_THINK_ROWS)
    {
        return rows;
    }

    const shown = rows.slice(-(COMPACT_THINK_ROWS - 1));
    const omitted = rows.length - shown.length;
    return [
        ...shown,
        `${
            theme.italic(theme.fg("thinkingText", `… ${String(omitted)} earlier ${omitted === 1 ? "row" : "rows"} · `))
        }${keyHint("app.tools.expand", "to expand")}`,
    ];
}
