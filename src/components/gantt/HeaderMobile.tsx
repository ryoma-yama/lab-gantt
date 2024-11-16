import type { UserProfile } from "@/App";
import SettingSheet from "./SettingSheet";

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
		<>
			{userProfile && (
				<SettingSheet
					{...{
						userProfile,
						isProfileDialogOpen,
						setIsProfileDialogOpen,
					}}
				/>
			)}
		</>
	);
};
export default HeaderPC;
