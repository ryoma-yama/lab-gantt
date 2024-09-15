import { Button, Select } from "@headlessui/react";
import { Gantt, type Task } from "neo-gantt-task-react";
import { useCallback, useEffect, useState } from "react";
import "neo-gantt-task-react/style.css";

import {
	type CondensedProjectSchema,
	Gitlab,
	type GroupSchema,
	type IssueSchemaWithBasicLabels,
} from "@gitbeaker/rest";
import { isValid, parseISO } from "date-fns";
import GitHubLogo from "./GitHubLogo";
import SettingsDialog from "./SettingsDialog";
import { parseFrontMatter } from "./frontMatterParser";

const App = () => {
	const [gitlabDomain, setGitLabDomain] = useState(
		localStorage.getItem("GITLAB_DOMAIN") || "",
	);
	const [gitlabAccessToken, setGitLabAccessToken] = useState(
		localStorage.getItem("GITLAB_ACCESS_TOKEN") || "",
	);
	type GitLabClinet = InstanceType<typeof Gitlab<false>>;
	const [gitlabClient, setGitLabClient] = useState<GitLabClinet | null>(null);

	const initializeGitlabClient = useCallback(() => {
		if (gitlabDomain && gitlabAccessToken) {
			return new Gitlab({
				host: gitlabDomain,
				token: gitlabAccessToken,
			});
		}
		return null;
	}, [gitlabDomain, gitlabAccessToken]);

	useEffect(() => {
		const loadGroups = async (client: GitLabClinet) => {
			try {
				const groups = await client.Groups.all();
				setGroups(groups);
			} catch (error) {
				console.error("Error fetching groups:", error);
			}
		};

		const client = initializeGitlabClient();
		if (client) {
			setGitLabClient(client);
			loadGroups(client);
		} else {
			setIsDialogOpen(true);
		}
	}, [initializeGitlabClient]);

	const [groups, setGroups] = useState<GroupSchema[]>([]);
	const [selectedGroupId, setSelectedGroupId] = useState("");

	const loadGroupsProject = async (groupId: string) => {
		try {
			if (!gitlabClient) return;
			const response = await gitlabClient.Groups.allProjects(groupId);
			setProjects(response);
		} catch (error) {
			console.error("Error loading projects:", error);
		}
	};

	const handleGroupChange = (groupId: string) => {
		setSelectedGroupId(groupId);
		loadGroupsProject(groupId);
	};

	const [projects, setProjects] = useState<CondensedProjectSchema[]>([]);
	const [selectedProjectId, setSelectedProjectId] = useState("");

	const loadProjectsIssues = async (projectId: string) => {
		try {
			if (!gitlabClient) return;
			const response = await gitlabClient.Issues.all({ projectId });
			const tasks = response.map(parseIssues);
			console.warn(tasks);
			setTasks(tasks);
		} catch (error) {
			console.error("Error loading issues:", error);
		}
	};

	const handleProjectChange = (projectId: string) => {
		setSelectedProjectId(projectId);
		loadProjectsIssues(projectId);
	};

	const [tasks, setTasks] = useState<Task[]>([]);

	interface Frontmatter {
		start: string;
		progress: number;
	}

	const extractFrontmatter = (markdown: string) => {
		const result = parseFrontMatter(markdown);
		if (result.data) {
			const { data } = result;
			// console.warn("Extracted data:", data);
			return data as Frontmatter;
		}
		return null;
	};

	const parseIssues = (response: IssueSchemaWithBasicLabels): Task => {
		const frontmatter = extractFrontmatter(response.description);
		let start: Date | null = null;
		let progress: number | null = null;

		if (frontmatter) {
			start = parseISO(frontmatter.start);
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
			// start: start || endDate,
			// end: endDate,
			start: endDate,
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

	const getUsersLanguage = () => {
		return navigator.language;
	};

	return (
		<>
			<header className="flex gap-2 p-2 bg-gray-100">
				<span className="text-2xl md:text-3xl">
					🦝 <span className="md:text-2xl font-bold">LabGantt</span>
				</span>
				<Button
					onClick={openDialog}
					className="rounded-md bg-black/20 py-2 px-4 text-sm font-medium text-white focus:outline-none data-[hover]:bg-black/30 data-[focus]:outline-1 data-[focus]:outline-white"
				>
					⚙️
					{/* <Cog6ToothIcon className="text-blue-500"/> */}
				</Button>
				<GitHubLogo />
			</header>
			<SettingsDialog
				{...{
					gitlabDomain,
					setGitLabDomain,
					gitlabAccessToken,
					setGitLabAccessToken,
				}}
				open={isDialogOpen}
				onClose={closeDialog}
				onSettingsSaved={setGitLabClient}
				gitlabInstance={gitlabClient}
			/>
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
				// onChange={(e) => setSelectedProjectId(e.target.value)}
				onChange={(e) => handleProjectChange(e.target.value)}
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
			{
				<Gantt
					tasks={tasks}
					onClick={(e) => console.warn(e)}
					locale={getUsersLanguage()}
				/>
			}
		</>
	);
};

export default App;
