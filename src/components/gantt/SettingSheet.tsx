import { buttonVariants } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/pages/Home";
import { Menu } from "lucide-react";
import "neo-gantt-task-react/style.css";
import githubMark from "../../assets/github-mark.svg";
import ProfileDialogMobile from "./ProfileDialogMobile";

interface SettingSheetProps {
	userProfile: UserProfile;
	isProfileDialogOpen: boolean;
	setIsProfileDialogOpen: (value: boolean) => void;
}

const SettingSheet: React.FC<SettingSheetProps> = ({
	userProfile,
	isProfileDialogOpen,
	setIsProfileDialogOpen,
}) => {
	return (
		<Sheet>
			<SheetTrigger>
				<Menu className="block sm:hidden" />
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Menu</SheetTitle>
				</SheetHeader>
				<div className="mt-2 mb-2">
					<ProfileDialogMobile
						{...{
							userProfile,
							isProfileDialogOpen,
							setIsProfileDialogOpen,
						}}
					/>
				</div>
				<div className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
					<a
						href="https://github.com/ryoma-yama/lab-gantt"
						target="_blank"
						rel="noopener noreferrer"
						className="w-full"
					>
						<div className="flex justify-center">
							<img
								src={githubMark}
								className="w-4 h-4 sm:w-8 sm:h-8 mr-2"
								alt="GitHub Mark"
							/>
							<span>GitHub</span>
						</div>
					</a>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default SettingSheet;
