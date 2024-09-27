import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gitlab } from "@gitbeaker/rest";

import { Settings } from "lucide-react";
import { useEffect, useState } from "react";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

interface SettingsDialogProps {
	open: boolean;
	onOpen: () => void;
	onClose: () => void;
	// onSettingsSaved: () => void;
	onSettingsSaved: SetState<InstanceType<typeof Gitlab<false>> | null>;
	gitlabDomain: string;
	setGitLabDomain: SetState<string>;
	gitlabAccessToken: string;
	setGitLabAccessToken: SetState<string>;
	gitlabInstance: InstanceType<typeof Gitlab> | null;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
	open,
	onOpen,
	onClose,
	onSettingsSaved,
	gitlabDomain,
	setGitLabDomain,
	gitlabAccessToken,
	setGitLabAccessToken,
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
			const api = new Gitlab({
				host: gitlabDomain,
				token: gitlabAccessToken,
			});

			const response = await api.Users.showCurrentUser();

			if (!response.web_url) {
				setErrorMessage("Invalid response: web_url not found.");
				return;
			}

			setSuccessMessage("✔success!");
			localStorage.setItem("GITLAB_DOMAIN", gitlabDomain);
			localStorage.setItem("GITLAB_ACCESS_TOKEN", gitlabAccessToken);
			onSettingsSaved(api);
			setTimeout(() => {
				onClose();
			}, 1000);
		} catch (error) {
			setErrorMessage(
				"Failed to retrieve user information. Please check your domain and access token.",
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(open) => open || onClose()}>
			<DialogTrigger asChild>
				<Button onClick={onOpen} variant="outline" size="icon">
					<Settings className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Enter Authentication Information</DialogTitle>
					<DialogDescription>
						Please enter your GitLab domain and Personal Access Token.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSaveSettings}>
					<div className="grid grid-cols-1 gap-4 mb-4">
						<Label htmlFor="gitlabDomain">GitLab Domain</Label>
						<Input
							type="text"
							id="gitlabDomain"
							value={gitlabDomain}
							onChange={(e) => setGitLabDomain(e.target.value)}
							placeholder="https://gitlab.com"
							required
						/>
						<Label htmlFor="gitlabAccessToken">Personal Access Token</Label>
						<Input
							type="password"
							id="gitlabAccessToken"
							value={gitlabAccessToken}
							onChange={(e) => setGitLabAccessToken(e.target.value)}
							placeholder="glpat-***"
							required
						/>
					</div>
					<DialogFooter>
						<p>
							<span className="font-bold">Note: </span>
							The authentication information will be stored in your browser's
							local storage. Therefore, it is not recommended to use this on
							public or shared devices.
						</p>
						<Button type="submit" disabled={invalid}>
							Save
						</Button>
					</DialogFooter>
				</form>
				<div className="h-6 mb-6">
					{errorMessage && <div className="text-red-600">{errorMessage}</div>}
					{successMessage && (
						<div className="text-green-600">{successMessage}</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SettingsDialog;
