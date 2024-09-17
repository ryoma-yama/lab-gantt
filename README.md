# 🦝 LabGantt: GitLab Tasks in Gantt Charts

LabGantt visualizes GitLab issues as Gantt charts. Supports both free and self-hosted GitLab instances.

## 💻 Try It Now!

👉 **[Access LabGantt here](https://ryoma-yama.github.io/lab-gantt/)** 👈

Powered by [neo-gantt-task-react](https://github.com/ryoma-yama/neo-gantt-task-react) 🌐

## 🎯 Intended Users

LabGantt is ideal for:

- **GitLab free account users** who want to visualize tasks as Gantt charts but don’t have access to premium features like built-in Gantt charts.

If you are using GitLab's **Premium** or **Ultimate** plans, you can use the built-in Roadmap feature for similar functionality.

## 💡 For GitHub Users

If you're using **GitHub**, consider using **GitHub Projects** with Roadmaps, which offers similar functionality for task management.

## ✨ Features

- 📊 Displays GitLab issues as Gantt charts.
- 🛠️ Works with free and self-hosted GitLab.
- 🧑‍💻 Simple interface for tracking project timelines.

## 🔍 How It Works

1. 🔗 Connects to your GitLab account via the GitLab API.
2. 📅 Retrieves your project issues and shows them as Gantt charts.
3. 📈 Lets you manage and track progress in one view.

## 📝 Usage

To display GitLab issues as Gantt charts, include the following YAML in the issue body:

| Parameter  | Type   | Required | Description                                            |
|------------|--------|----------|--------------------------------------------------------|
| `start`    | Date   | Yes      | Start date in `YYYY-MM-DD` format.                     |
| `end`      | Date   | No       | End date in `YYYY-MM-DD` format.                       |
| `progress` | Number | No       | Progress as a percentage (`0-100`).                    |

Example:

```yaml
---
start: 2024-08-05
end: 2024-08-10
progress: 50
---
```

## 📄 License

MIT

## Legal Disclaimer

GitLab is a registered trademark of GitLab Inc. This project is not affiliated with GitLab Inc.
