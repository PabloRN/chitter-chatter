# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Automated release management system with manual version control
- GitHub Actions workflows for production releases and staging deployments
- CHANGELOG generation from conventional commits
- Version validation and branch checking in release script

### Changed
- Removed automatic deployment on master merge
- Deployments now only trigger on version tag pushes

### Fixed
- Room creation no longer duplicates `picture` field
- Background images now auto-generate thumbnails
- Minimum requirements validation (1 background + 2 avatars)

## [0.1.0] - Initial Release

### Added
- Firebase authentication with email links
- Room creation and management
- Real-time chat functionality
- User avatars and profiles
- Admin panel for preloaded backgrounds and avatars
- Theme switcher (light/dark mode)
- Private messaging system