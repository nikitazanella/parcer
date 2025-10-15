import { promises as fs } from "fs";

/**
 * Sets a nested property in an object using dot notation.
 *
 * @param obj - The object to set the property on.
 * @param path - The dot-separated path to the property.
 * @param value - The value to set.
 */
function setNested(
	obj: Record<string, unknown>,
	path: string,
	value: unknown,
): void {
	const keys = path.split(".");
	let current: Record<string, unknown> = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		if (typeof current[keys[i]] !== "object" || current[keys[i]] === null) {
			current[keys[i]] = {};
		}
		current = current[keys[i]] as Record<string, unknown>;
	}
	current[keys[keys.length - 1]] = value;
}

/**
 * Converts a CSV file to a JSON file.
 *
 * @param {string} input - The path to the input CSV file.
 * @param {string} output - The path to the output JSON file.
 * @param {object} options - Options for the conversion.
 * @param {boolean} options.flatten - Whether to create nested objects from dot-separated headers (e.g., "user.name" becomes { user: { name: ... } }).
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function parcer(
	input: string,
	output: string,
	options: { flatten?: boolean } = {},
): Promise<void> {
	const { flatten = false } = options;
	// Check if both input and output file paths are provided
	if (!input || !output) {
		console.error("Please provide both input and output file paths.");
		return;
	}

	try {
		// Read the CSV file
		const csvData = await fs.readFile(input, "utf8");
		console.log("CSV Data:", csvData); // Debugging line

		// Split the CSV data into lines
		const lines = csvData.split("\n");
		// Extract the headers from the first line
		const headers = lines[0].split(",").map((h: string) => h.trim());

		// Convert the CSV data to JSON format
		const jsonData = lines.slice(1).map((line: string) => {
			const values = line.split(",").map((v: string) => v.trim());
			// Check if the number of values matches the number of headers
			if (values.length !== headers.length) {
				throw new Error("Malformed CSV data");
			}
			// Create an object for each line
			return headers.reduce(
				(obj: Record<string, unknown>, header: string, index: number) => {
					if (flatten) {
						setNested(obj, header, values[index]);
					} else {
						obj[header] = values[index];
					}
					return obj;
				},
				{} as Record<string, unknown>,
			);
		});

		console.log("JSON Data:", JSON.stringify(jsonData, null, 2)); // Debugging line

		// Write the JSON data to the output file
		await fs.writeFile(output, JSON.stringify(jsonData, null, 2));
	} catch (error) {
		// Log any errors that occur during the process
		console.error(`Error: ${(error as Error).message}`);
	}
}
