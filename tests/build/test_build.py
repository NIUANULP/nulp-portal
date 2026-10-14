import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]


class BuildTests(unittest.TestCase):
    def run_build(self, failure="", docker="true", cdn="false"):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = root / "src/app"
            app.mkdir(parents=True)
            for name in [
                "client", "libs", "helpers", "proxy", "resourcebundles",
                "sunbird-plugins", "routes", "constants", "controllers",
            ]:
                (app / name).mkdir()
            (app / "package.json").write_text('{\n"version": "4.10.0"\n}\n')
            (app / "yarn.lock").write_text("# fixture lockfile\n")
            for name in ["framework.config.js", "server.js"]:
                (app / name).touch()
            (root / "Dockerfile").touch()
            shutil.copy(ROOT / "build.sh", root / "build.sh")
            nvm = root / ".nvm"
            nvm.mkdir()
            (nvm / "nvm.sh").write_text("nvm() { :; }\n")
            (nvm / "bash_completion").touch()
            binaries = root / "bin"
            binaries.mkdir()
            commands = {
                "git": "printf abc123",
                "yarn": """
if [[ "$PWD" == */app_dist ]]; then
    test -f yarn.lock || exit 10
    [[ "$*" == *--frozen-lockfile* ]] || exit 11
    [[ "$*" == *https://registry.npmjs.org* ]] || exit 12
    [[ "$FAILURE" != server_install ]] || exit 13
else
    [[ "$FAILURE" != client_install ]] || exit 14
    mkdir -p node_modules/ngtek-event-library/node_modules/common-form-elements-event
fi
""",
                "npm": """
if [[ "$*" == "run build" ]]; then
    [[ "$FAILURE" != client_build ]] || exit 15
    mkdir -p ../app_dist/dist
    touch ../app_dist/dist/index.html
else
    [[ "$FAILURE" != cdn_build ]] || exit 16
fi
touch "$HOME/client_completed"
""",
                "node": """
if [[ "$*" == helpers/validateDependencies.js ]]; then
    [[ "$FAILURE" != validation ]] || exit 17
    touch "$HOME/validated"
fi
""",
                "docker": """
test -f "$HOME/validated" || exit 18
printf built > "$HOME/docker_called"
""",
            }
            for name, body in commands.items():
                command = binaries / name
                command.write_text("#!/bin/bash\n" + body + "\n")
                command.chmod(0o755)
            environment = dict(
                os.environ,
                HOME=str(root),
                PATH=str(binaries) + ":" + os.environ["PATH"],
                FAILURE=failure,
            )
            result = subprocess.run(
                ["bash", "build.sh", "test-tag", "test-node", "test-org",
                 docker, cdn, "https://example.invalid/"],
                cwd=root, env=environment, capture_output=True, text=True,
                timeout=10,
            )
            return (
                result, (root / "docker_called").exists(),
                (root / "client_completed").exists(),
            )

    def test_failed_builds_never_package_an_image(self):
        for failure in [
            "server_install", "client_install", "client_build",
            "cdn_build", "validation",
        ]:
            with self.subTest(failure=failure):
                result, packaged, client_completed = self.run_build(
                    failure, cdn="true"
                )
                self.assertNotEqual(result.returncode, 0, result.stdout)
                self.assertFalse(packaged)
                if failure in ["server_install", "validation"]:
                    self.assertTrue(client_completed)

    def test_successful_build_combinations(self):
        for docker, cdn in [
            ("true", "false"), ("true", "true"), ("false", "true"),
        ]:
            with self.subTest(docker=docker, cdn=cdn):
                result, packaged, _ = self.run_build(docker=docker, cdn=cdn)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(packaged, docker == "true")


class DependencyValidationTests(unittest.TestCase):
    def run_validation(self, logger=True, dependency=True, broken_logger=False,
                       entryless=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            helpers = root / "helpers"
            helpers.mkdir()
            shutil.copy(
                ROOT / "src/app/helpers/validateDependencies.js", helpers
            )
            (root / "package.json").write_text(json.dumps({
                "dependencies": {
                    "@project-sunbird/logger": "^0.0.9",
                    "build-test-fixture-dependency": "1.0.0",
                }
            }))
            if logger:
                module = root / "node_modules/@project-sunbird/logger"
                module.mkdir(parents=True)
                (module / "index.js").write_text(
                    "require('build-test-fixture-missing-transitive');"
                    if broken_logger else "module.exports = {};"
                )
            if dependency:
                module = root / "node_modules/build-test-fixture-dependency"
                module.mkdir(parents=True)
                if entryless:
                    (module / "package.json").write_text(json.dumps({
                        "name": "build-test-fixture-dependency",
                        "version": "1.0.0",
                    }))
                else:
                    (module / "index.js").write_text("module.exports = {};")
            return subprocess.run(
                ["node", "helpers/validateDependencies.js"], cwd=root,
                capture_output=True, text=True, timeout=10,
            )

    def test_complete_dependencies_pass(self):
        result = self.run_validation()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_missing_dependencies_fail(self):
        for options in [
            {"logger": False}, {"dependency": False}, {"broken_logger": True},
        ]:
            with self.subTest(options=options):
                result = self.run_validation(**options)
                self.assertNotEqual(result.returncode, 0)

    def test_installed_plugin_without_main_passes(self):
        result = self.run_validation(entryless=True)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
