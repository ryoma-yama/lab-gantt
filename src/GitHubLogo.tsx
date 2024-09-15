import githubMark from "./assets/github-mark.svg";

const GitHubLogo: React.FC = () => {
	return (
		<a
			href="https://github.com/ryoma-yama/lab-gantt"
			target="_blank"
			rel="noopener noreferrer"
			className="ml-auto"
		>
			<img src={githubMark} className="w-8 h-8" alt="GitHub Mark" />
		</a>
	);
};

export default GitHubLogo;
