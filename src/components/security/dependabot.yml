# Dependabot configuration for automated dependency updates
# Place this file at: .github/dependabot.yml

version: 2
updates:
  # npm package updates
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    
    # Limit open PRs to avoid noise
    open-pull-requests-limit: 10
    
    # Group updates for easier review
    groups:
      # Group all patch updates for dev dependencies
      dev-dependencies-patch:
        dependency-type: "development"
        update-types:
          - "patch"
      
      # Group all minor updates for dev dependencies
      dev-dependencies-minor:
        dependency-type: "development"
        update-types:
          - "minor"
      
      # Group patch updates for production dependencies
      production-dependencies-patch:
        dependency-type: "production"
        update-types:
          - "patch"
      
      # React ecosystem updates together
      react-ecosystem:
        patterns:
          - "react*"
          - "@types/react*"
      
      # Testing libraries together
      testing-libraries:
        patterns:
          - "@testing-library/*"
          - "vitest"
          - "@playwright/*"
      
      # UI libraries together
      ui-libraries:
        patterns:
          - "@radix-ui/*"
          - "lucide-react"
          - "framer-motion"
    
    # Labels for PRs
    labels:
      - "dependencies"
      - "automated"
      - "security"
    
    # PR settings
    pull-request-branch-name:
      separator: "-"
    
    commit-message:
      prefix: "chore"
      include: "scope"
    
    # Ignore specific updates
    ignore:
      # Ignore major React updates (manual review)
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
      - dependency-name: "react-dom"
        update-types: ["version-update:semver-major"]
      
      # Ignore Three.js majors (breaking changes frequent)
      - dependency-name: "three"
        update-types: ["version-update:semver-major"]
    
    # Auto-merge patch updates (requires GitHub Actions approval)
    # Commented out by default for safety
    # reviewers:
    #   - "your-team"
    # assignees:
    #   - "lead-developer"

  # GitHub Actions workflow updates
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
    labels:
      - "ci-cd"
      - "automated"