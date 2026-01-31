# CI/CD Export Workflow

GitHub Actions workflow for automated Godot 4.6 builds and exports.

## Structure

```
ci-cd-export/
├── .github/
│   └── workflows/
│       ├── build.yml          # Main build workflow
│       ├── release.yml        # Release workflow
│       └── pr-check.yml       # PR validation
├── scripts/
│   ├── export.sh              # Export script
│   └── version.sh             # Version management
├── export_presets.cfg         # Export configuration
└── README.md
```

## Workflows

### build.yml
Triggered on push to main/develop:
- Exports for all configured platforms
- Uploads artifacts
- Runs basic validation

### release.yml
Triggered on version tags (v*):
- Creates GitHub release
- Attaches built binaries
- Generates changelog

### pr-check.yml
Triggered on pull requests:
- Validates project opens
- Checks for errors
- Validates GDScript

## Supported Platforms

- Windows (x86_64)
- Linux (x86_64)
- macOS (Universal)
- Web (HTML5)
- Android (arm64, optional)

## Setup

1. Copy `.github/` folder to your repository
2. Copy `export_presets.cfg` to project root
3. Configure export presets in Godot
4. Add secrets for signing (optional):
   - `GODOT_ANDROID_KEYSTORE_BASE64`
   - `GODOT_ANDROID_KEYSTORE_PASSWORD`

## GitHub Actions Secrets

Required:
- None for basic builds

Optional:
- `BUTLER_API_KEY` - For itch.io deployment
- `STEAM_USERNAME` / `STEAM_CONFIG_VDF` - Steam deployment
- Android signing secrets

## Usage

```yaml
# Trigger build
git push origin main

# Create release
git tag v1.0.0
git push origin v1.0.0
```

## Customization

Edit `build.yml` to:
- Change Godot version
- Add/remove platforms
- Configure artifacts
- Add deployment steps

## Requirements

- GitHub repository
- Godot project with export presets
- (Optional) Platform-specific signing credentials
