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
import type { UserProfile } from "@/pages/Home";

import { User } from "lucide-react";

interface ProfileDialogProps {
	userProfile: UserProfile;
	isProfileDialogOpen: boolean;
	setIsProfileDialogOpen: (value: boolean) => void;
}

const ProfileDialogMobile: React.FC<ProfileDialogProps> = ({
	userProfile: { username, web_url },
	isProfileDialogOpen,
	setIsProfileDialogOpen,
}) => {
	const clearLocalStorage = () => {
		localStorage.clear();
		window.location.reload();
	};

	return (
		<Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" className="w-full">
					<div className="flex items-center">
						<div className="mr-2">
							<User className="h-4 w-4" />
						</div>
						<p>Profile</p>
					</div>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Profile</DialogTitle>
					<DialogDescription>
						You are currently authenticated. Below is your profile information.
					</DialogDescription>
				</DialogHeader>
				<div className="mb-5">
					<p>
						Authenticated as: <strong>{username}</strong>
					</p>
					<p>
						Profile Page:{" "}
						<a
							className="text-blue-600 hover:underline"
							href={web_url}
							target="_blank"
							rel="noopener noreferrer"
						>
							Link
						</a>
					</p>
				</div>
				<DialogFooter>
					<Button variant="destructive" onClick={clearLocalStorage}>
						Delete local authentication data
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ProfileDialogMobile;
