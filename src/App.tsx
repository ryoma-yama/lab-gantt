import { Gitlab } from "@gitbeaker/rest";
import { useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
// import Login from "./pages/Login"
// type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

const App = () => {
	const [gitlabDomain, setGitLabDomain] = useState(
		localStorage.getItem("GITLAB_DOMAIN") || "",
	);
	const [gitlabAccessToken, setGitLabAccessToken] = useState(
		localStorage.getItem("GITLAB_ACCESS_TOKEN") || "",
	);
	type GitLabClient = InstanceType<typeof Gitlab<false>>;
	const [gitlabClient, setGitLabClient] = useState<GitLabClient | null>(null);
	const api = new Gitlab({
		host: gitlabDomain,
		token: gitlabAccessToken,
	});

	const res = async () => {
		try {
			await api.Users.showCurrentUser();
			localStorage.setItem("GITLAB_DOMAIN", gitlabDomain);
			localStorage.setItem("GITLAB_ACCESS_TOKEN", gitlabAccessToken);
		} catch (error) {
			console.log(error);
		}
	};
	res();
	return (
		<>
			{gitlabDomain && gitlabAccessToken ? (
				<Home
					{...{
						gitlabDomain,
						setGitLabDomain,
						gitlabAccessToken,
						setGitLabAccessToken,
					}}
				/>
			) : (
				<Login
					onSettingsSaved={setGitLabClient}
					{...{
						gitlabDomain,
						setGitLabDomain,
						gitlabAccessToken,
						setGitLabAccessToken,
					}}
				/>
			)}
		</>
	);
};

export default App;
