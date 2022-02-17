import { test } from "@jest/globals"
import { execFileSync, ExecFileSyncOptions } from "child_process"
import { join } from "path/posix"
import { cwd, env, execPath } from "process"

// shows how the runner will run a javascript action with env / stdout protocol
test("test runs", () => {
  const ip = join(cwd(), "lib", "main.js")
  env["NODE_ENV"] = "test"

  env["INPUT_FILES"] = "test.txt"
  const options: ExecFileSyncOptions = {
    env
  }
  console.log(execFileSync(execPath, [ip], options).toString())
})
