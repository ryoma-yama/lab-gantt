import { Button, Select } from "@headlessui/react";
import { Gantt, type Task } from "gantt-task-react";
import { useEffect, useState } from "react";
import "gantt-task-react/dist/index.css";
import {
	type CondensedProjectSchema,
	Gitlab,
	type GroupSchema,
	type IssueSchemaWithBasicLabels,
} from "@gitbeaker/rest";
import { isValid, parseISO } from "date-fns";
import SettingsDialog from "./SettingsDialog";
import { parseFrontMatter } from "./frontMatterParser";

const App = () => {
	const [gitlabUrl, setGitlabUrl] = useState(
		localStorage.getItem("GITLAB_DOMAIN") || "",
	);
	const [token, setToken] = useState(
		localStorage.getItem("GITLAB_ACCESS_TOKEN") || "",
	);

	const api = new Gitlab({
		host: gitlabUrl,
		token: token,
	});

	const [groups, setGroups] = useState<GroupSchema[]>([]);
	const [selectedGroupId, setSelectedGroupId] = useState("");
	const fetchGroups = async () => {
		try {
			const response = await api.Groups.all();
			return response;
		} catch (error) {
			console.error("Error fetching groups:", error);
			throw error;
		}
	};

	const handleGroupChange = (groupId: string) => {
		setSelectedGroupId(groupId);
		fetchGroupsProject(groupId);
	};

	const [projects, setProjects] = useState<CondensedProjectSchema[]>([]);
	const [selectedProjectId, setSelectedProjectId] = useState("");
	const fetchGroupsProject = async (groupId: string) => {
		try {
			const response = await api.Groups.allProjects(groupId);
			setProjects(response);
		} catch (error) {
			console.error("Error fetching projects:", error);
		}
	};

	useEffect(() => {
		const gitlabDomain = localStorage.getItem("GITLAB_DOMAIN");
		const gitlabAccessToken = localStorage.getItem("GITLAB_ACCESS_TOKEN");

		if (!gitlabDomain || !gitlabAccessToken) {
			setIsDialogOpen(true);
		}
	}, []);
	// // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	// useEffect(() => {
	// 	(async () => {
	// 		if (gitlabUrl && token) {
	// 			try {
	// 				// const response = await fetchProjects();
	// 				// setProjects(response);
	// 				const response = await fetchGroups();
	// 				setGroups(response);
	// 			} catch (error) {
	// 				console.error("Error fetching projects:", error);
	// 			}
	// 		}
	// 	})();
	// }, [gitlabUrl, token]);

	interface Frontmatter {
		start: string;
		progress: number;
	}

	const extractFrontmatter = (markdown: string) => {
		const result = parseFrontMatter(markdown);
		if (result.data) {
			const { data } = result;
			console.warn("Extracted data:", data);
			return data as Frontmatter;
		}
		return null;
	};

	const fetchIssues = async (projectId: string) => {
		try {
			const response = await api.Issues.all({ projectId });
			return response;
		} catch (error) {
			console.error("Error fetching issues:", error);
			throw error;
		}
	};
	const [tasks, setTasks] = useState<Task[]>([]);
	const handleFetchIssues = async () => {
		try {
			const data = await fetchIssues(selectedProjectId);
			const tasks = data.map(parseIssues);
			console.warn(tasks);
			setTasks(tasks);
		} catch (error) {
			console.error(error);
		}
	};

	const parseIssues = (response: IssueSchemaWithBasicLabels): Task => {
		const frontmatter = extractFrontmatter(response.description);
		let start: Date | null = null;
		let progress: number | null = null;

		if (frontmatter) {
			start = parseISO(frontmatter.start);
			console.warn(start, isValid(start));
			if (!isValid(start)) {
				start = null;
			}
			progress = frontmatter.progress;
		}

		const endDate = response.due_date
			? parseISO(response.due_date)
			: new Date();
		if (!isValid(endDate)) {
			console.error(`Invalid due date for issue ${response.iid}`);
		}

		return {
			start: start || endDate,
			end: endDate,
			name: response.title,
			id: `${response.iid}`,
			type: "task",
			progress: progress !== null ? progress : 0,
			isDisabled: false,
			styles: { progressColor: "#ffbb54", progressSelectedColor: "#ff9e0d" },
		};
	};

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const openDialog = () => {
		setIsDialogOpen(true);
	};
	const closeDialog = () => {
		setIsDialogOpen(false);
	};

	return (
		<>
			<Button
				onClick={openDialog}
				className="rounded-md bg-black/20 py-2 px-4 text-sm font-medium text-white focus:outline-none data-[hover]:bg-black/30 data-[focus]:outline-1 data-[focus]:outline-white"
			>
				⚙️
			</Button>
			<SettingsDialog open={isDialogOpen} onClose={closeDialog} />
			<Select
				value={selectedGroupId}
				onChange={(e) => handleGroupChange(e.target.value)}
			>
				<option value="" disabled>
					グループを選択
				</option>
				{Array.isArray(groups) && groups.length > 0 ? (
					groups.map((project) => (
						<option key={project.id} value={project.id}>
							{project.name}
						</option>
					))
				) : (
					<option value="" disabled>
						グループがありません
					</option>
				)}
			</Select>
			<Select
				value={selectedProjectId}
				onChange={(e) => setSelectedProjectId(e.target.value)}
			>
				<option value="" disabled>
					プロジェクトを選択
				</option>
				{Array.isArray(projects) && projects.length > 0 ? (
					projects.map((project) => (
						<option key={project.id} value={project.id}>
							{project.name}
						</option>
					))
				) : (
					<option value="" disabled>
						プロジェクトがありません
					</option>
				)}
			</Select>
			<Button onClick={handleFetchIssues}>取得</Button>
			{tasks.length > 0 && <Gantt tasks={tasks} />}
		</>
	);
};

export default App;
