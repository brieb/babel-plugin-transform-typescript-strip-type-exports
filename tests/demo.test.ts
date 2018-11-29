import path from "path";
import os from "os";
import fs from "fs";
import { execSync } from "child_process";

const demoPath = path.resolve(__dirname, "../demo");

describe("demo", () => {
  describe("build", () => {
    execSync("npm run build", { cwd: demoPath });
    const libFiles = execSync(`find ${path.join(demoPath, "lib")} -type f`)
      .toString()
      .trim()
      .split(os.EOL)
      .sort();

    libFiles.forEach(libFile => {
      const relLibFile = path.relative(demoPath, libFile);
      it(`properly builds ${relLibFile}`, () => {
        expect(fs.readFileSync(libFile).toString()).toMatchSnapshot(relLibFile);
      });
    });
  });
});
