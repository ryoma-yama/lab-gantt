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
		if (client === null) {
			setIsDialogOpen(true);
			return;
		}
		setGitLabClient(client);
		loadGroups(client);

		if (selectedGroupId === "") return;
		loadGroupsProject(selectedGroupId, client);

		if (selectedProjectId === "") return;
		loadProjectsIssues(selectedProjectId, client);
	}, [initializeGitlabClient]);

	const [groups, setGroups] = useState<GroupSchema[]>([]);
	const [selectedGroupId, setSelectedGroupId] = useState(
		localStorage.getItem("SELECTED_GROUP_ID") || "",
	);

	const loadGroupsProject = async (
		groupId: string,
		client: GitLabClinet | null,
	) => {
		try {
			if (!client) return;
			const response = await client.Groups.allProjects(groupId);
			console.warn(response);
			setProjects(response);
		} catch (error) {
			console.error("Error loading projects:", error);
		}
	};

	const handleGroupChange = (groupId: string) => {
		setSelectedGroupId(groupId);
		localStorage.setItem("SELECTED_GROUP_ID", groupId);
		loadGroupsProject(groupId, gitlabClient);
	};

	const [projects, setProjects] = useState<CondensedProjectSchema[]>([]);
	const [selectedProjectId, setSelectedProjectId] = useState(
		localStorage.getItem("SELECTED_PROJECT_ID") || "",
	);

	const loadProjectsIssues = async (
		projectId: string,
		client: GitLabClinet | null,
	) => {
		try {
			if (!client) return;
			const response = await client.Issues.all({ projectId });
			// このAPIは、プロジェクトに関連するすべてのIssueとTaskを返す。
			// クライアントの問題かもしれないが、response.typeに"issue"と"task"の区別があり、taskの場合はdescriptionがnullになる。
			console.warn("Issues:", response);
			const tasks = response.map(parseIssues);
			console.warn("Parsed issues:", tasks);
			setTasks(tasks);
		} catch (error) {
			console.error("Error loading issues:", error);
		}
	};

	const handleProjectChange = (projectId: string) => {
		setSelectedProjectId(projectId);
		localStorage.setItem("SELECTED_PROJECT_ID", projectId);
		loadProjectsIssues(projectId, gitlabClient);
	};

	const [tasks, setTasks] = useState<Task[]>([]);

	interface Frontmatter {
		start: string;
		progress: number;
	}

	const extractFrontmatter = (markdown: string) => {
		const result = parseFrontMatter<Frontmatter>(markdown);
		// console.warn("Parsed frontmatter:", result);
		if (result.data.start) {
			const { data } = result;
			// console.warn("Extracted data:", data);
			return data as Frontmatter;
		}
		return null;
	};

	const parseIssues = (response: IssueSchemaWithBasicLabels): Task => {
		// type ISSUE_TYPES = "ISSUE" | "TASK";
		// 問題は、response.typeが"ISSUE"または"TASK"のどちらかであることではなく、descriptionが空文字だけではなくnullになること。
		// console.log("Parsing issue:", response);
		// console.warn("Parsing issue's description:", response.description);

		let start: Date | null = null;
		let progress: number | null = null;

		if (response.description && response.description.length > 0) {
			const frontmatter = extractFrontmatter(response.description);
			if (frontmatter) {
				// console.warn(frontmatter);
				start = parseISO(frontmatter.start);
				if (!isValid(start)) {
					start = null;
				}
				progress = frontmatter.progress;
			}
		}

		const endDate = response.due_date
			? parseISO(response.due_date)
			: new Date();
		if (!isValid(endDate)) {
			console.error(`Invalid due date for issue ${response.iid}`);
		}

		return {
			// start: endDate,
			start: start || endDate,
			end: endDate,
			name: response.title,
			id: `${response.iid}`,
			type: "task",
			progress: progress !== null ? progress : 0,
			isDisabled: false,
			styles: { progressColor: "#ffbb54", progressSelectedColor: "#ff9e0d" },
			url: response.web_url,
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
			<header className="flex gap-2 p-2 mb-2 bg-gray-100">
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
			<div className="pl-2">
				{gitlabClient === null ? (
					<p>Please authenticate to access GitLab data.</p>
				) : (
					<>
						<Select
							value={selectedGroupId}
							onChange={(e) => handleGroupChange(e.target.value)}
						>
							<option value="" disabled>
								Select a group
							</option>
							{groups.length > 0 ? (
								groups.map((group) => (
									<option key={group.id} value={group.id}>
										{group.name}
									</option>
								))
							) : (
								<option value="" disabled>
									No groups found
								</option>
							)}
						</Select>
						{selectedGroupId && (
							<Select
								value={selectedProjectId}
								onChange={(e) => handleProjectChange(e.target.value)}
							>
								<option value="" disabled>
									Select a project
								</option>
								{projects.length > 0 ? (
									projects.map((project) => (
										<option key={project.id} value={project.id}>
											{project.name}
										</option>
									))
								) : (
									<option value="" disabled>
										No projects found
									</option>
								)}
							</Select>
						)}
						{selectedProjectId && (
							<Gantt
								tasks={tasks}
								onClick={(e) => console.warn(e)}
								locale={getUsersLanguage()}
							/>
						)}
					</>
				)}
			</div>
		</>
	);
};

export default App;
