import {
	Dialog,
	DialogPanel,
	DialogTitle,
	Field,
	Fieldset,
	Input,
	Label,
	Legend,
	Transition,
} from "@headlessui/react";
import { Fragment, useState } from "react";

interface SettingsDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
	const [gitlabUrl, setGitlabUrl] = useState<string>("");
	const [token, setToken] = useState<string>("");

	const handleSaveSettings = () => {
		onClose();
	};

	return (
		<Transition show={isOpen} as={Fragment}>
			<Dialog
				open={isOpen}
				onClose={onClose}
				className="fixed inset-0 z-50 flex items-center justify-center p-4"
			>
				<div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
				<div className="fixed inset-0 flex items-center justify-center p-4">
					<DialogPanel className="w-full max-w-md p-6 bg-white rounded">
						<DialogTitle className="text-lg font-medium text-gray-900">
							設定
						</DialogTitle>
						<Fieldset className="space-y-8">
							<Legend className="text-lg font-bold">Host Settings</Legend>
							<Field>
								<Label>GitLab URL</Label>
								<Input
									name="gitlab-url"
									value={gitlabUrl}
									onChange={(e) => setGitlabUrl(e.target.value)}
								/>
							</Field>
							<Field>
								<Label>Access Token</Label>
								<Input
									name="access-token"
									value={token}
									onChange={(e) => setToken(e.target.value)}
								/>
							</Field>
						</Fieldset>
					</DialogPanel>
				</div>
			</Dialog>
		</Transition>
	);
};

export default SettingsDialog;
