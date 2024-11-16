import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import type {
	CondensedProjectSchema,
	Gitlab,
	GroupSchema,
	IssueSchemaWithBasicLabels,
} from "@gitbeaker/rest";
import { isValid, parseISO } from "date-fns";
import { Gantt, type Task } from "neo-gantt-task-react";
import "neo-gantt-task-react/style.css";
import type { GitLabClient } from "@/App";
import HelpCollapsible from "@/components/gantt/HelpCollapsible";
import ProfileDialog from "@/components/gantt/ProfileDialog";
import SortMenuPopover, {
	type SortField,
} from "@/components/gantt/SortMenuPopover";
import { parseFrontMatter } from "@/frontMatterParser";
import { compareAsc, compareDesc } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import GitHubLogo from "../GitHubLogo";
import iconLabGantt from "../assets/icon-lab-gantt.svg";

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
interface HomePageProps {
	gitlabClient: InstanceType<typeof Gitlab<false>>;
}

const Home: React.FC<HomePageProps> = ({ gitlabClient }) => {
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
	const [showTaskList, setShowTaskList] = useState(
		localStorage.getItem("SHOW_TASK_LIST") === "true",
	);
	const [showAllIssues, setShowAllIssues] = useState(
		localStorage.getItem("SHOW_ALL_ISSUES") === "true",
	);
	const [showAllMilestones, setShowAllMilestones] = useState(
		localStorage.getItem("SHOW_ALL_MILESTONES") === "true",
	);
	const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
	const [userProfile, setUserProfile] = useState<UserProfile | null>();
	const [sortFields, setSortFields] = useState<SortField[]>(
		JSON.parse(localStorage.getItem("SORT_FIELDS") || "[]") as SortField[],
	);

	const { toast } = useToast();

	useEffect(() => {
		loadGroups(gitlabClient);

		loadCurrentUser(gitlabClient);

		if (selectedGroupId === "") return;
		loadGroupsProject(selectedGroupId, gitlabClient);

		if (selectedProjectId === "") return;
		loadProjectsIssues(selectedProjectId, gitlabClient);
	}, [gitlabClient, selectedGroupId, selectedProjectId]);

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

	const getUsersLanguage = () => {
		return navigator.language;
	};

	const handleSaveDisplayPreferences = () => {
		localStorage.setItem("SHOW_ALL_ISSUES", `${showAllIssues}`);
		localStorage.setItem("SHOW_ALL_MILESTONES", `${showAllMilestones}`);
		localStorage.setItem("SHOW_TASK_LIST", `${showTaskList}`);
		localStorage.setItem("SORT_FIELDS", JSON.stringify(sortFields));
		toast({ title: "Display preferences saved successfully!" });
	};

	const sortedTasks = useMemo(() => {
		if (sortFields.length === 0) {
			return tasks;
		}

		const sortedFields = sortFields.toSorted((a, b) => a.priority - b.priority);

		return tasks.toSorted((a, b) => {
			for (const sortField of sortedFields) {
				const aValue = a[sortField.key as keyof Task];
				const bValue = b[sortField.key as keyof Task];

				let comparisonResult = 0;

				switch (sortField.key) {
					case "id":
						comparisonResult =
							sortField.direction === "asc" ? +a.id - +b.id : +b.id - +a.id;
						break;

					case "start":
					case "end":
						comparisonResult =
							sortField.direction === "asc"
								? compareAsc(aValue as Date, bValue as Date)
								: compareDesc(aValue as Date, bValue as Date);
						break;

					default:
						comparisonResult = 0;
				}

				if (comparisonResult !== 0) {
					return comparisonResult;
				}
			}

			return 0;
		});
	}, [tasks, sortFields]);

	return (
		<>
			<header className="flex gap-2 p-2 mb-2 bg-zinc-100">
				<img src={iconLabGantt} className="w-8 h-8" alt="GitHub Mark" />
				<span className="md:text-2xl font-bold">LabGantt</span>
				<div className="flex gap-2">
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
													<SelectItem key={project.id} value={`${project.id}`}>
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
					{userProfile && (
						<ProfileDialog
							{...{
								userProfile,
								isProfileDialogOpen,
								setIsProfileDialogOpen,
							}}
						/>
					)}
				</div>
				<div className="ml-auto">
					<GitHubLogo />
				</div>
			</header>
			<div className="px-2">
				{selectedProjectId && (
					<>
						<div className="flex h-5 lg:h-8 items-center space-x-5 mb-3">
							<div className="flex items-center space-x-2">
								<Switch
									id="show-from-to-date"
									checked={showTaskList}
									onCheckedChange={setShowTaskList}
								/>
								<Label htmlFor="show-from-to-date">Show Task list</Label>
							</div>
							<Separator orientation="vertical" />
							<SortMenuPopover {...{ sortFields, setSortFields }} />
							<Separator orientation="vertical" />
							<div className="flex items-center space-x-2">
								<Switch
									id="status-filter"
									checked={showAllIssues}
									onCheckedChange={setShowAllIssues}
								/>
								<Label htmlFor="status-filter">Status: Open / All</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="milestone-filter"
									checked={showAllMilestones}
									onCheckedChange={setShowAllMilestones}
								/>
								<Label htmlFor="milestone-filter">
									Milestone: Linked / All
								</Label>
							</div>
							<Separator orientation="vertical" />
							<Button onClick={handleSaveDisplayPreferences} size="sm">
								Save
							</Button>
						</div>
						<HelpCollapsible
							{...{
								showAllIssues,
								setShowAllIssues,
								showAllMilestones,
								setShowAllMilestones,
								selectedProjectId,
								issues,
								setIssues,
								showFromToDate: showTaskList,
							}}
							gitlabInstance={gitlabClient}
						/>
						<Gantt
							tasks={sortedTasks}
							locale={getUsersLanguage()}
							showFromTo={true}
							listCellWidth={showTaskList ? "155px" : ""}
						/>
					</>
				)}
			</div>
			<Toaster />
		</>
	);
};

export default Home;
