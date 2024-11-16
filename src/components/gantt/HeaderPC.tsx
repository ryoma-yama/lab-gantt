import type { UserProfile } from "@/App";
import "neo-gantt-task-react/style.css";
import ProfileDialogPC from "./ProfileDialogPC";

interface HeaderPCProps {
	userProfile: UserProfile;
	isProfileDialogOpen: boolean;
	setIsProfileDialogOpen: (value: boolean) => void;
}

const HeaderPC: React.FC<HeaderPCProps> = ({
	userProfile,
	isProfileDialogOpen,
	setIsProfileDialogOpen,
}) => {
	return (
		<div className="hidden sm:flex">
			{userProfile && (
				<ProfileDialogPC
					{...{
						userProfile,
						isProfileDialogOpen,
						setIsProfileDialogOpen,
					}}
				/>
			)}
		</div>
	);
};
export default HeaderPC;
