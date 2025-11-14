# Astro Starter Kit: Minimal

```sh
bun create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Installs dependencies                            |
| `bun run dev`             | Starts local dev server at `localhost:4321`      |
| `bun run build`           | Build your production site to `./dist/`          |
| `bun run preview`         | Preview your build locally, before deploying     |
| `bun run test`            | Run tests in watch mode (use this, not `bun test`!) |
| `bun run test:run`        | Run tests once (CI mode)                         |
| `bun run test:ui`         | Run tests with Vitest UI                         |
| `bun run deploy:vercel`   | Deploy to Vercel (production)                    |
| `bun run deploy:netlify`  | Deploy to Netlify (production)                   |
| `bun run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun run astro -- --help` | Get help using the Astro CLI                     |

> **⚠️ Important:** Use `bun run test`, NOT `bun test`. Bun's native test runner is incompatible with our SolidJS setup. See [TEST_RUNNER_GUIDE.md](TEST_RUNNER_GUIDE.md) for details.

## 📦 Deployment

The project supports multiple deployment platforms:

- **GitHub Pages** (current): Automatic deployment on push to `main`
- **Vercel**: `bun run deploy:vercel`
- **Netlify**: `bun run deploy:netlify`

For detailed deployment instructions, rollback procedures, and CI/CD configuration, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
