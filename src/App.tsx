import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";
import {
	type CondensedProjectSchema,
	Gitlab,
	type GroupSchema,
	type IssueSchemaWithBasicLabels,
} from "@gitbeaker/rest";
import { isValid, parseISO } from "date-fns";
import { Gantt, type Task } from "neo-gantt-task-react";
import "neo-gantt-task-react/style.css";
import { useCallback, useEffect, useState } from "react";
import GitHubLogo from "./GitHubLogo";
import HelpCollapsible from "./components/gantt/HelpCollapsible";
import ProfileDialog from "./components/gantt/ProfileDialog";
import SettingsDialog from "./components/gantt/SettingsDialog";
import { parseFrontMatter } from "./frontMatterParser";

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

	const endDate = response.due_date ? parseISO(response.due_date) : new Date();
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
		url: response.web_url,
	};
};

export interface UserProfile {
	username: string;
	web_url: string;
}

const App = () => {
	const [gitlabDomain, setGitLabDomain] = useState(
		localStorage.getItem("GITLAB_DOMAIN") || "",
	);
	const [gitlabAccessToken, setGitLabAccessToken] = useState(
		localStorage.getItem("GITLAB_ACCESS_TOKEN") || "",
	);
	type GitLabClient = InstanceType<typeof Gitlab<false>>;
	const [gitlabClient, setGitLabClient] = useState<GitLabClient | null>(null);
	const [selectedGroupId, setSelectedGroupId] = useState(
		localStorage.getItem("SELECTED_GROUP_ID") || "",
	);
	const [selectedProjectId, setSelectedProjectId] = useState(
		localStorage.getItem("SELECTED_PROJECT_ID") || "",
	);
	const [groups, setGroups] = useState<GroupSchema[]>([]);
	const [projects, setProjects] = useState<CondensedProjectSchema[]>([]);
	const [issues, setIssues] = useState<IssueSchemaWithBasicLabels[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [showAllIssues, setShowAllIssues] = useState(
		localStorage.getItem("SHOW_ALL_ISSUES") === "true",
	);
	const [showAllMilestones, setShowAllMilestones] = useState(
		localStorage.getItem("SHOW_ALL_MILESTONES") === "true",
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
	const [userProfile, setUserProfile] = useState<UserProfile | null>();

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
		const client = initializeGitlabClient();
		if (client === null) {
			setIsDialogOpen(true);
			return;
		}
		setGitLabClient(client);
		loadGroups(client);

		// TODO: Migrate to Login page
		loadCurrentUser(client);

		if (selectedGroupId === "") return;
		loadGroupsProject(selectedGroupId, client);

		if (selectedProjectId === "") return;
		loadProjectsIssues(selectedProjectId, client);
	}, [initializeGitlabClient, selectedGroupId, selectedProjectId]);

	const loadCurrentUser = async (client: GitLabClient) => {
		try {
			const user = await client.Users.showCurrentUser();
			setUserProfile({ username: user.username, web_url: user.web_url });
		} catch (error) {
			console.error("Error fetching current user", error);
		}
	};

	const loadGroups = async (client: GitLabClient) => {
		try {
			const groups = await client.Groups.all();
			setGroups(groups);
		} catch (error) {
			console.error("Error fetching groups:", error);
		}
	};

	const loadGroupsProject = async (
		groupId: string,
		client: GitLabClient | null,
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

	const loadProjectsIssues = async (
		projectId: string,
		client: GitLabClient | null,
	) => {
		try {
			if (!client) return;
			const response = await client.Issues.all({ projectId });
			// response.typeに"issue"と"taskD"の区別があり、taskの場合はdescriptionがnullになる。
			console.warn("Issues:", response);
			setIssues(response);
		} catch (error) {
			console.error("Error loading issues:", error);
		}
	};

	useEffect(() => {
		const filteredIssues = showAllIssues
			? issues
			: issues.filter((issue) => issue.state === "opened");

		const finalIssues = showAllMilestones
			? filteredIssues
			: filteredIssues.filter((issue) => issue.milestone !== null);
		const tasks = finalIssues.map(parseIssues);
		console.warn("Tasks(Parsed issues):", tasks);
		setTasks(tasks);
	}, [issues, showAllIssues, showAllMilestones]);

	const handleProjectChange = (projectId: string) => {
		setSelectedProjectId(projectId);
		localStorage.setItem("SELECTED_PROJECT_ID", projectId);
		loadProjectsIssues(projectId, gitlabClient);
	};

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
					{userProfile && (
						<ProfileDialog
							{...{
								userProfile,
								isProfileDialogOpen,
								setIsProfileDialogOpen,
							}}
						/>
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
			<div className="px-2">
				{gitlabClient === null ? (
					<p>Please authenticate to access GitLab data.</p>
				) : (
					<>
						{selectedProjectId && (
							<>
								<HelpCollapsible
									{...{
										showAllIssues,
										setShowAllIssues,
										showAllMilestones,
										setShowAllMilestones,
										selectedProjectId,
										issues,
										setIssues,
									}}
									gitlabInstance={gitlabClient}
								/>
								<hr className="my-3 border-t-2 border-gray-300" />
								<Gantt tasks={tasks} locale={getUsersLanguage()} />
							</>
						)}
					</>
				)}
			</div>
			<Toaster />
		</>
	);
};

export default App;
