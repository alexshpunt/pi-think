# pi-think

<p align="center">
  <img src="assets/logo.png" alt="pi-think logo" width="480">
</p>

Explicit, tool-driven reasoning for [Pi](https://pi.dev).

`pi-think` disables the model provider's native reasoning and gives the agent a private `think` tool instead. The agent uses that tool to work through intent, assumptions, ambiguity, alternatives, and consequences before it continues.

## Why this exists

`pi-think` is an experimental extension for exploring how explicit reasoning prompts affect coding agents. It is built for experimentation, personal tuning, and fun. It lets you shape what the agent should consider instead of accepting a provider's fixed reasoning pipeline.

There is no proven general performance gain, and the project is not an attempt to distill or reproduce a provider's hidden reasoning. The author's own informal use suggests that explicit reasoning can help some models stay on long-running tasks and follow instructions more consistently. That is anecdotal, not a benchmark or a guarantee.

The useful part is control. You can change the reasoning prompt, tell the agent which concepts to examine, and influence how often it pauses to reason. This creates room to try different prompts, model-specific workflows, structured state, or other experiments.

## What it does

- Adds a private `think` scratchpad to Pi.
- Uses Pi's real provider-specific thinking-off controls.
- Can require another reasoning pass after tools return new information.
- Renders reasoning as a compact block that can be expanded.
- Refuses to run when a model cannot fully disable native reasoning.

`pi-think` does not treat `minimal` or `low` reasoning as off. If Pi marks a model's off level as unsupported, the extension disables its external reasoning mode and shows a warning.

## Install

Install from npm:

```bash
pi install npm:pi-think
```

Or install from GitHub:

```bash
pi install git:github.com/alexshpunt/pi-think
```

You can also try it without installing:

```bash
pi -e npm:pi-think
```

## Use

Run `/think` to open the settings panel.

- `on` enables the `think` tool when Pi's thinking level is `off` and the selected model supports a real native-reasoning off mode.
- `off` removes the tool.

Keep Pi's thinking level set to `off`. The provider then receives its native hard-off setting, while the agent reasons through the extension's `think` tool.

## Custom reasoning prompt

The default reasoning prompt is included in `resources/reasoning.md`.

To replace it, create:

```text
~/.pi/agent/reasoning.override.md
```

The override is loaded when the extension starts. Run `/reload` after changing it.

## Provider support

The extension relies on Pi's model metadata and provider serializers instead of guessing from model names. Pi currently handles hard-off controls such as:

- `reasoning.effort: "none"`
- `thinking: { type: "disabled" }`
- `enable_thinking: false`
- `thinkingBudget: 0`

Support depends on the selected provider, API dialect, and model. Models that cannot fully disable native reasoning are not supported.

## Project direction

The extension may grow as it is used, but there is no promised roadmap. Issues, experiments, and forks are welcome.

Changes can be integrated when they strengthen the original idea: give people a simple, general way to control reasoning in Pi. Features that lock the extension into one model, one workflow, or one strongly opinionated prompting method are better kept as separate experiments or forks.

This follows Pi's philosophy: provide a small, direct mechanism and let users shape it for their own work.

## License

[MIT](LICENSE)
