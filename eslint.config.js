import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Build outputs and vendored trees: turtlebot_mcp_ros2/ ships colcon build
  // artifacts whose .ts files are CMake depend-files, not TypeScript, and
  // backend/{build,install} are colcon spaces. Linting them produces only
  // parse errors.
  globalIgnores([
    'dist',
    'coverage',
    'node_modules',
    'turtlebot_mcp_ros2',
    'backend/build',
    'backend/install',
    '.venv-test',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
