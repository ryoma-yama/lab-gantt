import { Gitlab } from "@gitbeaker/rest";
import {
	Button,
	Dialog,
	DialogPanel,
	DialogTitle,
	Field,
	Input,
	Label,
} from "@headlessui/react";
import { useEffect, useState } from "react";

interface SettingsDialogProps {
	open: boolean;
	onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
	const [gitlabDomain, setGitlabDomain] = useState(
		localStorage.getItem("GITLAB_DOMAIN") || "",
	);
	const [gitlabAccessToken, setGitLabAccessToken] = useState(
		localStorage.getItem("GITLAB_ACCESS_TOKEN") || "",
	);
	const [invalid, setInvalid] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		setInvalid(gitlabDomain.trim() === "" || gitlabAccessToken.trim() === "");
	}, [gitlabDomain, gitlabAccessToken]);

	const handleSaveSettings = async (event: React.FormEvent) => {
		event.preventDefault();
		setErrorMessage(null);

		try {
			const api = new Gitlab({
				host: gitlabDomain,
				token: gitlabAccessToken,
			});

			const response = await api.Users.showCurrentUser();

			if (!response.web_url) {
				setErrorMessage("Invalid response: web_url not found.");
				return;
			}

			localStorage.setItem("GITLAB_DOMAIN", gitlabDomain);
			localStorage.setItem("GITLAB_ACCESS_TOKEN", gitlabAccessToken);
			onClose();
		} catch (error) {
			setErrorMessage(
				"Failed to retrieve user information. Please check your domain and access token.",
			);
		}
	};

	const defaultInput =
		"block w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-200 focus: ring-opacity-50 focus:border-indigo-300";

	const defaultButton =
		"block w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";

	const disabledButton =
		"block w-full px-4 py-2 text-sm font-medium text-white bg-gray-400 border border-transparent rounded-md shadow-sm cursor-not-allowed";

	return (
		<Dialog
			{...{ open, onClose }}
			transition
			className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-[closed]:opacity-0"
		>
			<DialogPanel className="max-w-lg w-full space-y-4 bg-white p-12">
				<DialogTitle className="text-2xl font-bold mb-4">
					Please setting
				</DialogTitle>
				<form onSubmit={handleSaveSettings}>
					<div className="grid grid-cols-1 gap-6 mt-4">
						<div className="h-6">
							{errorMessage && (
								<div className="text-red-600">{errorMessage}</div>
							)}
						</div>
						<Field>
							<Label className="text-gray-700">GitLab Domain</Label>
							<Input
								type="text"
								name="gitlabDomain"
								value={gitlabDomain}
								onChange={(e) => setGitlabDomain(e.target.value)}
								className={defaultInput}
								placeholder="https://gitlab.com"
								required={true}
							/>
						</Field>
						<Field>
							<Label className="text-gray-700">Personal Access Token</Label>
							<Input
								type="text"
								name="gitlabAccessToken"
								value={gitlabAccessToken}
								onChange={(e) => setGitLabAccessToken(e.target.value)}
								className={defaultInput}
								placeholder="glpat-***"
								required
							/>
						</Field>
						<Button
							type="submit"
							className={invalid ? disabledButton : defaultButton}
							disabled={invalid}
						>
							Save
						</Button>
					</div>
				</form>
			</DialogPanel>
		</Dialog>
	);
};

export default SettingsDialog;
