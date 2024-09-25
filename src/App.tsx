import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Gantt, type Task } from "neo-gantt-task-react";
import "neo-gantt-task-react/style.css";
import { useCallback, useEffect, useState } from "react";

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
				<span className="text-2xl md:text-3xl flex-none mr-2">
					🦝 <span className="md:text-2xl font-bold">LabGantt</span>
				</span>
				<div className="flex gap-2">
					{gitlabClient === null ? (
						<p>Please authenticate to access GitLab data.</p>
					) : (
						<>
							<Select
								value={selectedGroupId}
								onValueChange={(value) => handleGroupChange(value)}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Select a group" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Select a group</SelectLabel>
										{groups.length > 0 ? (
											groups.map((group) => (
												<SelectItem key={group.id} value={`${group.id}`}>
													{group.name}
												</SelectItem>
											))
										) : (
											<SelectItem value="0" disabled>
												No groups found
											</SelectItem>
										)}
									</SelectGroup>
								</SelectContent>
							</Select>

							{selectedGroupId && (
								<>
									<span className="flex items-center">/</span>
									<Select
										value={selectedProjectId}
										onValueChange={(value) => handleProjectChange(value)}
									>
										<SelectTrigger className="w-[180px]">
											<SelectValue placeholder="Select a project" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>Select a project</SelectLabel>
												{projects.length > 0 ? (
													projects.map((project) => (
														<SelectItem
															key={project.id}
															value={`${project.id}`}
														>
															{project.name}
														</SelectItem>
													))
												) : (
													<SelectItem value="0" disabled>
														No projects found
													</SelectItem>
												)}
											</SelectGroup>
										</SelectContent>
									</Select>
								</>
							)}
						</>
					)}
					<SettingsDialog
						{...{
							gitlabDomain,
							setGitLabDomain,
							gitlabAccessToken,
							setGitLabAccessToken,
						}}
						open={isDialogOpen}
						onOpen={openDialog}
						onClose={closeDialog}
						onSettingsSaved={setGitLabClient}
						gitlabInstance={gitlabClient}
					/>
				</div>
				<div className="ml-auto">
					<GitHubLogo />
				</div>
			</header>
			<div className="pl-2">
				{gitlabClient === null ? (
					<p>Please authenticate to access GitLab data.</p>
				) : (
					<>
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
