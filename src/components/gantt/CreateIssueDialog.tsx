import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type {
	CreateIssueOptions,
	Gitlab,
	IssueSchemaWithBasicLabels,
} from "@gitbeaker/rest";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createIssueSchema = z.object({
	title: z.string().min(1, "Title is required").max(255, "Title is too long"),
	description: z.string().optional(),
	date: z
		.object({
			from: z.date().optional(),
			to: z.date().optional(),
		})
		.optional(),
});

interface CreateIssueDialogProps {
	isCreateIssueDialogOpen: boolean;
	setIsCreateIssueDialogOpen: (value: boolean) => void;
	gitlabInstance: InstanceType<typeof Gitlab>;
	selectedProjectId: string;
	issues: IssueSchemaWithBasicLabels[];
	setIssues: (issues: IssueSchemaWithBasicLabels[]) => void;
}

const CreateIssueDialog: React.FC<CreateIssueDialogProps> = ({
	isCreateIssueDialogOpen,
	setIsCreateIssueDialogOpen,
	gitlabInstance,
	selectedProjectId,
	issues,
	setIssues,
}) => {
	const createIssueForm = useForm<z.infer<typeof createIssueSchema>>({
		resolver: zodResolver(createIssueSchema),
		defaultValues: {
			title: "",
			description: "",
			date: {
				from: undefined,
				to: undefined,
			},
		},
	});
	const { reset } = createIssueForm;
	const { toast } = useToast();

	const onSubmit = async (data: z.infer<typeof createIssueSchema>) => {
		const startDate = format(data.date?.from || new Date(), "yyyy-MM-dd");
		const description = `---\nstart: ${startDate}\nprogress: 0\n---\n${data.description}`;
		const options: CreateIssueOptions = {
			description: description,
			dueDate: data.date?.to ? format(data.date?.to, "yyyy-MM-dd") : undefined,
		};
		try {
			const createdIssue = await gitlabInstance.Issues.create(
				selectedProjectId,
				data.title,
				options,
			);
			reset();
			setIsCreateIssueDialogOpen(false);
			setIssues([...issues, createdIssue as IssueSchemaWithBasicLabels]);
			toast({
				title: "Issue created successfully!",
			});
		} catch (error) {
			console.error("Error creating issue:", error);
		}
	};

	return (
		<Dialog
			open={isCreateIssueDialogOpen}
			onOpenChange={setIsCreateIssueDialogOpen}
		>
			<DialogTrigger asChild>
				<Button variant="outline">
					<Plus className="mr-2 h-4 w-4" /> Create New Issue
				</Button>
			</DialogTrigger>
			<DialogContent className="md:max-w-xl">
				<DialogHeader>
					<DialogTitle>Create New Issue</DialogTitle>
					<DialogDescription>
						Fill in the details to create a new issue.
					</DialogDescription>
				</DialogHeader>
				<Form {...createIssueForm}>
					<form
						onSubmit={createIssueForm.handleSubmit(onSubmit)}
						className="space-y-8"
					>
						<FormField
							control={createIssueForm.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="title">Title (required)</FormLabel>
									<FormControl>
										<Input {...field} maxLength={255} autoComplete="off" />
									</FormControl>
									<FormDescription>
										Provide a short and descriptive title for the issue.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={createIssueForm.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="description">Description</FormLabel>
									<FormControl>
										<Textarea className="resize-none" {...field} />
									</FormControl>
									<FormDescription>
										Provide a detailed description of the issue.{" "}
										<strong>Note:</strong> The necessary frontmatter will be
										automatically added to the description.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={createIssueForm.control}
							name="date"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Start and Due Dates</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													id="date"
													variant={"outline"}
													className={cn(
														"w-[300px] justify-start text-left font-normal",
														!field.value && "text-muted-foreground",
													)}
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{field.value?.from ? (
														field.value.to ? (
															<>
																{format(field.value.from, "yyyy-MM-dd")} -{" "}
																{format(field.value.to, "yyyy-MM-dd")}
															</>
														) : (
															format(field.value.from, "yyyy-MM-dd")
														)
													) : (
														<span>Pick a date</span>
													)}
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												initialFocus
												mode="range"
												defaultMonth={field.value?.from}
												selected={field.value as DateRange}
												onSelect={field.onChange}
												numberOfMonths={2}
											/>
										</PopoverContent>
									</Popover>
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="submit">Create Issue</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default CreateIssueDialog;
