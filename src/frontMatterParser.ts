interface FrontMatterResult<T> {
	data: T;
	content: string;
}

export function parseFrontMatter<T>(content: string): FrontMatterResult<T> {
	const match = content.match(/^---\n([\s\S]+?)\n---/);
	if (!match) return { data: {} as T, content };

	const yaml = match[1];
	const body = content.slice(match[0].length).trim();
	const data = parseYAML<T>(yaml);

	return { data, content: body };
}

function parseYAML<T>(yaml: string): T {
	const lines = yaml.split("\n");
	const data: Partial<T> = {};

	for (const line of lines) {
		const [key, value] = line.split(":").map((str) => str.trim()) as [
			keyof T,
			string,
		];
		if (key) {
			const numValue = Number(value);
			data[key] = Number.isNaN(numValue)
				? (value as unknown as T[keyof T])
				: (numValue as unknown as T[keyof T]);
		}
	}

	return data as T;
}
