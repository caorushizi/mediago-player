# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MediaGo Player is a hybrid application combining a Go backend server with multiple React frontend applications. The project uses a monorepo structure managed by Turborepo and pnpm workspaces, with Go handling the HTTP server and embedded static file serving.

## Architecture

### Backend (Go)

The backend follows a clean architecture pattern with clear separation of concerns:

- **Entry Point**: [cmd/server/main.go](cmd/server/main.go) - HTTP server setup with graceful shutdown
- **HTTP Layer**: [internal/http/router.go](internal/http/router.go) - Gin router configuration, middleware chain, and dual SPA routing
- **Domain Logic**: `internal/user/` - Example domain with handler → service → types pattern
- **Static Assets**: [assets/embed.go](assets/embed.go) - Embeds both web-desktop and web-mobile dist directories into the Go binary using `//go:embed`

The router serves two SPAs:
- Desktop version at `/` (from `apps/web-desktop/dist`)
- Mobile version at `/m/` (from `apps/web-mobile/dist`)

### Frontend (React + TypeScript + Vite)

Two separate React applications in the monorepo:
- [apps/web-desktop/](apps/web-desktop/) - Desktop-optimized web UI
- [apps/web-mobile/](apps/web-mobile/) - Mobile-optimized web UI

Both apps share identical tech stack:
- React 19 with React Compiler enabled (via `babel-plugin-react-compiler`)
- TypeScript 5.9
- Vite 7 (using `rolldown-vite` fork for faster builds)
- ESLint with TypeScript support

**Important**: The React Compiler is enabled and will impact dev/build performance. See [React Compiler docs](https://react.dev/learn/react-compiler) for details.

## Development Commands

### Full Stack Development

```bash
# Start all apps in development mode (backend + both frontends)
pnpm dev

# Build all apps
pnpm build

# Preview production builds
pnpm preview
```

### Backend Only (Go)

```bash
# Run server in development mode
task dev
# or: go run ./cmd/server

# With video root override
go run ./cmd/server -video-root "D:\\Videos"

# Run tests
task test
# or: go test ./...

# Generate Swagger documentation
task swagger
# or: swag init -g cmd/server/main.go -o docs

# Build binary (includes swagger generation)
task build
# Output: dist/server

# Run built binary
task run
# or: ./dist/server
```

### API Documentation

The project includes Swagger/OpenAPI documentation:

- **Swagger UI**: Available at `http://localhost:8080/swagger/index.html` when the server is running
- **JSON Spec**: `http://localhost:8080/swagger/doc.json`
- **Generation**: Run `task swagger` to regenerate docs (automatically done during `task build`)

To add API documentation to new endpoints:
1. Add Swagger comments to handler functions (see [internal/video/handler.go](internal/video/handler.go) for examples)
2. Run `task swagger` to regenerate documentation
3. Swagger comments follow [swaggo annotation format](https://github.com/swaggo/swag#declarative-comments-format)

### Frontend Only

```bash
# Work in a specific app
cd apps/web-desktop  # or apps/web-mobile

# Development server
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Preview build
pnpm preview
```

## Configuration

Environment variables (see [.env.example](.env.example)):
- `HTTP_ADDR` - Server address (default: `:8080`)
- `GIN_MODE` - Gin mode: `debug`, `release`, or `test` (default: `release`)
- `VIDEO_ROOT_PATH` - Local folder for video files (can also pass `-video-root` flag)

## Project Structure

```
mediago-player/
├── apps/                    # Frontend applications
│   ├── web-desktop/        # Desktop React app
│   └── web-mobile/         # Mobile React app
├── assets/                 # Static assets embedded into Go binary
│   └── embed.go            # Embeds frontend dist folders using //go:embed
├── cmd/server/             # Go HTTP server entry point
├── internal/               # Go private packages
│   ├── http/              # Router, middleware, and static file serving
│   │   ├── middleware/    # CORS, request ID, etc.
│   │   ├── router.go      # Main router configuration
│   │   └── static.go      # SPA static file handler
│   ├── user/              # Example domain (handler/service/types pattern)
│   └── util/              # Shared utilities (graceful shutdown, etc.)
├── taskfile.yaml          # Task runner for Go commands
├── turbo.json             # Turborepo pipeline configuration
└── pnpm-workspace.yaml    # pnpm workspace definition
```

## Key Patterns

### Adding New Domains (Go Backend)

1. Create directory under `internal/` (e.g., `internal/product/`)
2. Define domain types in `types.go`
3. Implement service interface in `service.go`
4. Create HTTP handlers in `handler.go` with `RegisterRoutes(rg *gin.RouterGroup)` function
5. Register routes in [internal/http/router.go](internal/http/router.go) under the `/api/v1` group

See [internal/user/](internal/user/) for reference implementation.

### Embedded Static Files

Frontend builds are embedded into the Go binary at compile time. The build pipeline:
1. `task build` or `pnpm build` creates `dist/` in each frontend app
2. Build task copies `apps/web-*/dist/` to `assets/web-*/dist/` (these directories are git-ignored)
3. Go's `//go:embed` directive in [assets/embed.go](assets/embed.go) embeds these copied directories
4. [internal/http/static.go](internal/http/static.go) provides `NewSPAHandler()` for serving embedded files with:
   - Automatic MIME type detection (using `mime.TypeByExtension` and content-based detection)
   - SPA routing fallback to `index.html` for client-side routes
   - Path prefix support for multiple SPAs (e.g., `/m/` for mobile)
   - Security: Path traversal protection via `path.Clean()`

**Important**: The `assets/web-desktop/` and `assets/web-mobile/` directories are generated during build and should not be committed to git. They are populated by the build task which copies the frontend dist folders.

When adding new frontend apps:
1. Update the embed directive in [assets/embed.go](assets/embed.go)
2. Update the copy commands in [taskfile.yaml](taskfile.yaml) build task
3. Add a new `SPAHandler` in [internal/http/router.go](internal/http/router.go)
4. Add the new directory to [.gitignore](.gitignore)

### Vite Configuration

Both frontend apps use rolldown-vite instead of standard Vite for better performance. This is configured via pnpm overrides in package.json. The React plugin is configured with Babel to enable the React Compiler.

## Testing

```bash
# Backend tests
go test ./...

# Test specific package
go test ./internal/user

# Test with coverage
go test -cover ./...

# Frontend tests (when added)
cd apps/web-desktop && pnpm test
```
