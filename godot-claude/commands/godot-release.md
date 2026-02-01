---
name: godot-release
description: Complete release workflow for Godot games
argument-hint: "--platform [windows|linux|mac|web|all] --version 1.0.0"
allowed-tools:
  - Write
  - Read
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
---

# Godot Release Workflow

Complete release preparation and export workflow for Godot 4.6 games.

## Arguments

Parse user input:
- `--platform`: Target platform(s) - windows, linux, mac, web, android, ios, all
- `--version`: Version string (e.g., 1.0.0)
- `--channel`: Release channel - stable, beta, alpha
- `--dry-run`: Validate without exporting

## Execution

### 1. Pre-Release Checks

```bash
# Check for project.godot
find . -name "project.godot" -maxdepth 2

# Check for export_presets.cfg
find . -name "export_presets.cfg" -maxdepth 2

# Check git status
git status --short
```

Validate:
- [ ] No uncommitted changes (or confirm intentional)
- [ ] Export templates installed
- [ ] Export presets configured
- [ ] Version number updated

### 2. Update Version

Update in `project.godot`:
```ini
[application]
config/version="{VERSION}"
```

Create/update `CHANGELOG.md`:
```markdown
## [{VERSION}] - {DATE}

### Added
- {New features from git log}

### Changed
- {Changes}

### Fixed
- {Bug fixes}
```

### 3. Pre-Export Tasks

```bash
# Generate git changelog
git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~20)..HEAD

# Run tests (if GUT installed)
godot --headless -s addons/gut/gut_cmdln.gd --should_exit 2>/dev/null || echo "No tests configured"
```

### 4. Export Builds

Create export directory structure:
```
exports/
├── {version}/
│   ├── windows/
│   │   └── {game}.exe
│   ├── linux/
│   │   └── {game}.x86_64
│   ├── mac/
│   │   └── {game}.dmg
│   └── web/
│       ├── index.html
│       └── {game}.wasm
```

Export commands:
```bash
# Create export directories
mkdir -p exports/{VERSION}/{windows,linux,mac,web}

# Windows
godot --headless --export-release "Windows Desktop" "exports/{VERSION}/windows/{GAME}.exe"

# Linux
godot --headless --export-release "Linux" "exports/{VERSION}/linux/{GAME}.x86_64"

# macOS
godot --headless --export-release "macOS" "exports/{VERSION}/mac/{GAME}.dmg"

# Web
godot --headless --export-release "Web" "exports/{VERSION}/web/index.html"
```

### 5. Post-Export Validation

Verify exports:
```bash
# Check file sizes
ls -lh exports/{VERSION}/**/*

# Verify executables exist
file exports/{VERSION}/windows/*.exe
file exports/{VERSION}/linux/*.x86_64
```

### 6. Create Release Package

For each platform:
```bash
# Windows - ZIP
cd exports/{VERSION}/windows && zip -r ../../{GAME}-{VERSION}-windows.zip .

# Linux - tar.gz
cd exports/{VERSION}/linux && tar -czvf ../../{GAME}-{VERSION}-linux.tar.gz .

# Web - ZIP
cd exports/{VERSION}/web && zip -r ../../{GAME}-{VERSION}-web.zip .
```

### 7. Generate Release Notes

Create `RELEASE_NOTES.md`:
```markdown
# {GAME} v{VERSION}

## Downloads
- [Windows]({URL})
- [Linux]({URL})
- [macOS]({URL})
- [Web]({URL})

## What's New
{Changelog excerpt}

## System Requirements

### Minimum
- OS: Windows 10 / macOS 10.15 / Ubuntu 20.04
- Processor: Intel Core i5 / AMD equivalent
- Memory: 4 GB RAM
- Graphics: OpenGL 3.3 compatible
- Storage: {SIZE} MB

## Installation

### Windows
1. Extract ZIP file
2. Run {GAME}.exe

### Linux
1. Extract tar.gz
2. Make executable: `chmod +x {GAME}.x86_64`
3. Run: `./{GAME}.x86_64`

### Web
Play at: {URL}

## Known Issues
- {Issue 1}
- {Issue 2}

## Feedback
Report issues at: {REPO}/issues
```

### 8. Git Tag & Push

```bash
# Create annotated tag
git tag -a v{VERSION} -m "Release v{VERSION}"

# Push tag
git push origin v{VERSION}
```

## Platform-Specific Notes

### Windows
- Code signing optional but recommended
- Include Visual C++ redistributable info

### macOS
- Notarization required for distribution outside App Store
- Universal binary (Intel + Apple Silicon) recommended

### Linux
- Test on common distros (Ubuntu, Fedora)
- Include required library info

### Web
- Test in Chrome, Firefox, Safari
- Consider itch.io butler for uploads
- PWA configuration for offline play

### Android
- Keystore required for release builds
- APK and AAB formats available

### iOS
- Requires Mac with Xcode
- App Store provisioning profile needed

## Store Integration

### Steam (Steamworks)
```bash
# Upload via SteamCMD
steamcmd +login {USER} +run_app_build ../scripts/app_build.vdf +quit
```

### itch.io (Butler)
```bash
# Install butler
# Upload build
butler push exports/{VERSION}/windows {USER}/{GAME}:windows --userversion {VERSION}
butler push exports/{VERSION}/linux {USER}/{GAME}:linux --userversion {VERSION}
butler push exports/{VERSION}/web {USER}/{GAME}:web --userversion {VERSION}
```

### GOG
- Use GOG Galaxy Pipeline Builder
- Upload via web interface or CLI

## Release Checklist

### Pre-Release
- [ ] Version bumped in project.godot
- [ ] Changelog updated
- [ ] All tests passing
- [ ] No debug code remaining
- [ ] Credits updated
- [ ] Screenshots/trailer ready

### Export
- [ ] Windows build exported and tested
- [ ] Linux build exported and tested
- [ ] macOS build exported and tested
- [ ] Web build exported and tested

### Post-Release
- [ ] Git tagged and pushed
- [ ] Builds uploaded to stores
- [ ] Release notes published
- [ ] Social media announced
- [ ] Press kit available

## Tips

- Always test exports on clean machines
- Keep previous version backups
- Monitor crash reports after release
- Prepare hotfix process
- Document platform-specific requirements
