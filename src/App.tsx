import { Gitlab } from "@gitbeaker/rest";
import { useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";

export type GitLabClient = InstanceType<typeof Gitlab<false>>;

const App = () => {
	const [gitlabDomain, setGitLabDomain] = useState(
		localStorage.getItem("GITLAB_DOMAIN") || "",
	);
	const [gitlabAccessToken, setGitLabAccessToken] = useState(
		localStorage.getItem("GITLAB_ACCESS_TOKEN") || "",
	);
	const initializeGitLabClient = () => {
		if (gitlabDomain && gitlabAccessToken) {
			return new Gitlab({
				host: gitlabDomain,
				token: gitlabAccessToken,
			});
		}
		return null;
	};
	const [gitlabClient, setGitLabClient] = useState<GitLabClient | null>(
		initializeGitLabClient(),
	);

	return (
		<>
			{gitlabClient ? (
				<Home
					{...{
						gitlabClient,
					}}
				/>
			) : (
				<Login
					{...{
						gitlabDomain,
						setGitLabDomain,
						gitlabAccessToken,
						setGitLabAccessToken,
						setGitLabClient,
					}}
				/>
			)}
		</>
	);
};

export default App;
