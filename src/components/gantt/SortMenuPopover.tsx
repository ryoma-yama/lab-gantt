import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	ArrowDownUp,
	ArrowDownWideNarrow,
	ArrowUpNarrowWide,
} from "lucide-react";

type Direction = "asc" | "desc";

export interface SortField {
	key: string;
	direction: Direction;
	priority: number;
}

interface SortMenuPopoverProps {
	sortFields: SortField[];
	setSortFields: (sortFields: SortField[]) => void;
}

const options = [
	{ label: "ID", key: "id" },
	{ label: "Start date", key: "start" },
	{ label: "Due date", key: "end" },
];

const SortMenuPopover: React.FC<SortMenuPopoverProps> = ({
	sortFields,
	setSortFields,
}) => {
	const toggleSort = (key: string) => {
		const existingSort = sortFields.find((field) => field.key === key);

		if (existingSort) {
			const newDirection: Direction =
				existingSort.direction === "asc" ? "desc" : "asc";
			const updatedFields = sortFields.map((field) =>
				field.key === key ? { ...field, direction: newDirection } : field,
			);
			setSortFields(updatedFields);
		} else {
			const newField: SortField = {
				key,
				direction: "asc",
				priority: sortFields.length < 2 ? sortFields.length + 1 : 1,
			};
			const newFields =
				sortFields.length < 2 ? [...sortFields, newField] : [newField];
			setSortFields(newFields);
		}
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">
					<ArrowDownUp className="mr-2 w-4 h-4" />
					Sort
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<div aria-label="Select a field to sort by" className="p-2">
					<div className="space-y-2">
						<h4 className="font-medium leading-none">Sort by</h4>
						<p className="text-sm text-muted-foreground">
							Select up to 2 fields
						</p>
					</div>
					<ul className="space-y-1">
						{options.map((option) => {
							const isSelected = sortFields.find(
								(field) => field.key === option.key,
							);
							const direction = isSelected ? isSelected.direction : null;
							const priority = isSelected ? isSelected.priority : null;

							return (
								<li key={option.key} className="flex items-center">
									<Button
										variant="ghost"
										onClick={() => toggleSort(option.key)}
										className="flex justify-between w-full"
									>
										<span>{option.label}</span>
										{isSelected && (
											<span className="flex space-x-1 text-xs text-zinc-500">
												{direction === "asc" ? (
													<ArrowUpNarrowWide className="w-4 h-4" />
												) : (
													<ArrowDownWideNarrow className="w-4 h-4" />
												)}
												<span>(Priority: {priority})</span>
											</span>
										)}
									</Button>
								</li>
							);
						})}
						<li>
							<Button
								variant="ghost"
								onClick={() => setSortFields([])}
								className="w-full"
							>
								No sorting
							</Button>
						</li>
					</ul>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default SortMenuPopover;
