import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gitlab } from "@gitbeaker/rest";
import { useEffect, useState } from "react";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

interface LoginPageProps {
	gitlabDomain: string;
	setGitLabDomain: SetState<string>;
	gitlabAccessToken: string;
	setGitLabAccessToken: SetState<string>;
	setGitLabClient: SetState<InstanceType<typeof Gitlab<false>> | null>;
}

const Login: React.FC<LoginPageProps> = ({
	gitlabDomain,
	setGitLabDomain,
	gitlabAccessToken,
	setGitLabAccessToken,
	setGitLabClient,
}) => {
	const [invalid, setInvalid] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	useEffect(() => {
		setInvalid(gitlabDomain.trim() === "" || gitlabAccessToken.trim() === "");
	}, [gitlabDomain, gitlabAccessToken]);

	const handleSaveSettings = async (event: React.FormEvent) => {
		event.preventDefault();
		setErrorMessage(null);

		try {
			const gitlabClient = new Gitlab({
				host: gitlabDomain,
				token: gitlabAccessToken,
			});

			const response = await gitlabClient.Users.showCurrentUser();

			if (!response.web_url) {
				setErrorMessage("Invalid response: web_url not found.");
				return;
			}

			setSuccessMessage("✔success!");
			localStorage.setItem("GITLAB_DOMAIN", gitlabDomain);
			localStorage.setItem("GITLAB_ACCESS_TOKEN", gitlabAccessToken);
			setGitLabClient(gitlabClient);
		} catch (error) {
			setErrorMessage(
				"Failed to retrieve user information. Please check your domain and access token.",
			);
		}
	};

	return (
		<div className="mx-auto px-2 lg:px-0 max-w-2xl mt-3">
			<h1 className="text-3xl font-bold mb-6">
				🦝 LabGantt: GitLab Tasks in Gantt Charts
			</h1>
			<p>
				LabGantt visualizes GitLab issues as Gantt charts. Supports both free
				and self-hosted GitLab instances.
			</p>
			<Accordion type="single" collapsible className="mb-4">
				<AccordionItem value="intended-users">
					<AccordionTrigger>🎯 Intended Users</AccordionTrigger>
					<AccordionContent>
						LabGantt is ideal for <strong>GitLab free account users</strong> who
						want to visualize tasks as Gantt charts but don't have access to
						premium features like built-in Gantt charts.
						<br />
						If you're on <strong>GitLab Premium</strong> or{" "}
						<strong>Ultimate</strong>, the built-in Roadmap feature offers
						similar functionality.
						<br />
						<br />
						<em>Note for GitHub users:</em> For similar functionality, consider
						using <strong>GitHub Projects</strong> with Roadmaps.
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="features">
					<AccordionTrigger>✨ Features</AccordionTrigger>
					<AccordionContent>
						<ul className="list-disc ml-5">
							<li>📊 Displays GitLab issues as Gantt charts.</li>
							<li>🛠️ Works with free and self-hosted GitLab.</li>
							<li>🧑‍💻 Simple interface for tracking project timelines.</li>
						</ul>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="how-it-works">
					<AccordionTrigger>🔍 How It Works</AccordionTrigger>
					<AccordionContent>
						<ol className="list-decimal ml-5">
							<li>🔗 Connects to your GitLab account via the GitLab API.</li>
							<li>
								📅 Retrieves your project issues and shows them as Gantt charts.
							</li>
							<li>📈 Lets you manage and track progress in one view.</li>
						</ol>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
			<Card>
				<CardHeader>
					<CardTitle>Enter Authentication Information</CardTitle>
					<CardDescription>
						Please enter your GitLab domain and Personal Access Token.
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSaveSettings}>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 mb-4">
							<Label htmlFor="gitlabDomain">GitLab Domain</Label>
							<Input
								type="text"
								autoComplete="username"
								id="gitlabDomain"
								value={gitlabDomain}
								onChange={(e) => setGitLabDomain(e.target.value)}
								placeholder="https://gitlab.com"
								required
							/>
							<Label htmlFor="gitlabAccessToken">Personal Access Token</Label>
							<Input
								type="password"
								autoComplete="current-password"
								id="gitlabAccessToken"
								value={gitlabAccessToken}
								onChange={(e) => setGitLabAccessToken(e.target.value)}
								placeholder="glpat-***"
								required
							/>
						</div>
					</CardContent>
					<CardFooter>
						<p>
							<span className="font-bold">Note: </span>
							The authentication information will be stored in your browser's
							local storage. Therefore, it is not recommended to use this on
							public or shared devices.
						</p>
						<Button type="submit" disabled={invalid}>
							Save
						</Button>
					</CardFooter>
				</form>
				<div className="h-6 mb-6">
					{errorMessage && <div className="text-red-600">{errorMessage}</div>}
					{successMessage && (
						<div className="text-green-600">{successMessage}</div>
					)}
				</div>
			</Card>
		</div>
	);
};

export default Login;
