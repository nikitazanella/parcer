// tests/parcer.test.ts
import { promises as fs } from "fs";
import { parcer } from "../src/index";

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

describe("parcer", () => {
  const inputPath = "tests/sample/input.csv";
  const outputPath = "tests/sample/output.json";
  const sampleCsvData = "name,age\nJohn,30\nJane,25";
  const emptyCsvData = "";
  const malformedCsvData = "name,age\nJohn,30\nJane";

  beforeEach(() => {
    jest.resetAllMocks();
    (fs.readFile as jest.Mock).mockResolvedValue(sampleCsvData);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
  });

  it("should convert CSV to JSON and save to output path", async () => {
    await parcer(inputPath, outputPath);

    expect(fs.readFile).toHaveBeenCalledWith(inputPath, "utf8");
    expect(fs.writeFile).toHaveBeenCalledWith(
      outputPath,
      JSON.stringify(
        [
          { name: "John", age: "30" },
          { name: "Jane", age: "25" },
        ],
        null,
        2
      )
    );
  });

  it("should log an error if input or output is missing", async () => {
    console.error = jest.fn();

    await parcer("", outputPath);
    expect(console.error).toHaveBeenCalledWith(
      "Please provide both input and output file paths."
    );

    await parcer(inputPath, "");
    expect(console.error).toHaveBeenCalledWith(
      "Please provide both input and output file paths."
    );
  });

  it("should handle empty CSV file", async () => {
    (fs.readFile as jest.Mock).mockResolvedValue(emptyCsvData);

    await parcer(inputPath, outputPath);

    expect(fs.readFile).toHaveBeenCalledWith(inputPath, "utf8");
    expect(fs.writeFile).toHaveBeenCalledWith(outputPath, "[]");
  });

  it("should handle malformed CSV data", async () => {
    console.error = jest.fn();
    (fs.readFile as jest.Mock).mockResolvedValue(malformedCsvData);

    await parcer(inputPath, outputPath);

    expect(fs.readFile).toHaveBeenCalledWith(inputPath, "utf8");
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Error")
    );
  });

  it("should handle non-existent input file", async () => {
    console.error = jest.fn();
    (fs.readFile as jest.Mock).mockRejectedValue(new Error("File not found"));

    await parcer(inputPath, outputPath);

    expect(fs.readFile).toHaveBeenCalledWith(inputPath, "utf8");
    expect(console.error).toHaveBeenCalledWith("Error: File not found");
  });

  it("should handle no write permission on output path", async () => {
    console.error = jest.fn();
    (fs.writeFile as jest.Mock).mockRejectedValue(
      new Error("Permission denied")
    );

    await parcer(inputPath, outputPath);

    expect(fs.readFile).toHaveBeenCalledWith(inputPath, "utf8");
    expect(fs.writeFile).toHaveBeenCalledWith(
      outputPath,
      JSON.stringify(
        [
          { name: "John", age: "30" },
          { name: "Jane", age: "25" },
        ],
        null,
        2
      )
    );
    expect(console.error).toHaveBeenCalledWith("Error: Permission denied");
  });

  it("should convert CSV to JSON with flattening when flatten option is true", async () => {
    const csvDataWithDots = "user.name,user.age,occupation\nAlice,30,Engineer\nBob,25,Designer";
    (fs.readFile as jest.Mock).mockResolvedValue(csvDataWithDots);

    await parcer(inputPath, outputPath, { flatten: true });

    expect(fs.readFile).toHaveBeenCalledWith(inputPath, "utf8");
    expect(fs.writeFile).toHaveBeenCalledWith(
      outputPath,
      JSON.stringify(
        [
          { user: { name: "Alice", age: "30" }, occupation: "Engineer" },
          { user: { name: "Bob", age: "25" }, occupation: "Designer" },
        ],
        null,
        2
      )
    );
  });
});
