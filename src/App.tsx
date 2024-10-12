import { useState } from "react";
import Home from "./pages/Home";
// import Login from "./pages/Login"
// type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

const App = () => {
	const [gitlabDomain, setGitLabDomain] = useState(
		localStorage.getItem("GITLAB_DOMAIN") || "",
	);
	const [gitlabAccessToken, setGitLabAccessToken] = useState(
		localStorage.getItem("GITLAB_ACCESS_TOKEN") || "",
	);

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
				<div>login</div>
			)}
		</>
	);
};

export default App;
