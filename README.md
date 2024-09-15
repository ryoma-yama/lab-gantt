# LabGantt

LabGantt visualizes GitLab project issues as Gantt charts using the GitLab API. Works with both free GitLab accounts and self-hosted GitLab instances.

Access it here: [https://ryoma-yama.github.io/lab-gantt/](https://ryoma-yama.github.io/lab-gantt/).

Powered by [neo-gantt-task-react](https://github.com/ryoma-yama/neo-gantt-task-react).

## Usage

To display GitLab issues as Gantt charts, the following information in YAML format must be included in the frontmatter of the issue body:

| Parameter  | Type   | Required | Description                                            |
|------------|--------|----------|--------------------------------------------------------|
| `start`    | Date   | Yes      | The start date of the issue in `YYYY-MM-DD` format.    |
| `end`      | Date   | No       | The end date of the issue in `YYYY-MM-DD` format.      |
| `progress` | Number | No       | The progress of the issue in percentage (`0-100`).     |

Example:
```yaml
---
start: 2024-08-05
end: 2024-08-10
progress: 50
---
```

## License

MIT
