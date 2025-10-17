#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Starting changelog parsing...')

// Paths
const changelogPath = path.resolve(__dirname, '../../CHANGELOG.md')
const outputDir = path.resolve(__dirname, '../src/generated/releases')

console.log('📖 Reading changelog from:', changelogPath)
console.log('📁 Output directory:', outputDir)

// Check if changelog exists
if (!fs.existsSync(changelogPath)) {
    console.error('❌ Changelog not found at:', changelogPath)
    process.exit(1)
}

// Read changelog
const changelogContent = fs.readFileSync(changelogPath, 'utf-8')
console.log('📄 Changelog loaded, length:', changelogContent.length, 'characters')

// Parse releases using split-based approach for better content extraction
const releases = []

// Split changelog into sections by version headers
const versionSections = changelogContent.split(/^## \[v(\d+\.\d+\.\d+)\]/gm)

// Process each version section (skip first empty element)
for (let i = 1; i < versionSections.length; i += 2) {
    const version = versionSections[i]
    const sectionContent = versionSections[i + 1] || ''

    const changes = extractChangesFromSection(sectionContent)

    if (changes.length > 0) {
        const release = {
            version,
            changes
        }

        releases.push(release)
        console.log(`📝 Parsed release v${version} with ${changes.length} changes`)
    }
}

function extractChangesFromSection(sectionContent) {
    const lines = sectionContent.split('\n')
    const changes = []
    let currentChange = null
    let collectingMultilineDescription = false

    for (const line of lines) {
        const trimmedLine = line.trim()

        // Skip empty lines and section headers
        if (!trimmedLine || trimmedLine.startsWith('###')) {
            // Stop collecting multiline content when we hit a section break
            if (trimmedLine.startsWith('###')) {
                collectingMultilineDescription = false
            }
            continue
        }

        // Check if this is a new change entry
        if (trimmedLine.startsWith('- [#')) {
            // Save previous change if exists
            if (currentChange) {
                changes.push(currentChange)
            }

            // Create new change entry
            currentChange = parseChangeEntry(trimmedLine)
            collectingMultilineDescription = true
        } else if (collectingMultilineDescription && currentChange) {
            // Check if this is indented content (part of the multiline description)
            if (line.startsWith('    ') || line.startsWith('\t')) {
                // This is indented content, part of the description
                currentChange.description += ' ' + trimmedLine
            } else if (trimmedLine.startsWith('- ') && !trimmedLine.startsWith('- [#')) {
                // This is a bullet point in the description, not a new change
                currentChange.description += ' ' + trimmedLine.replace(/^- /, '')
            } else {
                // Any other content that might be part of the description
                currentChange.description += ' ' + trimmedLine
            }
        }
    }

    // Don't forget the last change
    if (currentChange) {
        changes.push(currentChange)
    }

    return changes
}

function parseChangeEntry(line) {
    const item = {
        description: line.replace(/^- /, '').trim(),
        category: 'other'
    }

    // Extract PR number
    const prMatch = line.match(/\[#(\d+)\]/)
    if (prMatch) {
        item.prNumber = parseInt(prMatch[1])
    }

    // Extract commit hash
    const commitMatch = line.match(/\[`([a-f0-9]+)`\]/)
    if (commitMatch) {
        item.commitHash = commitMatch[1]
    }

    // Extract author - updated regex to handle hyphens and other valid GitHub username characters
    const authorMatch = line.match(/Thanks \[@([\w-]+)\]/)
    if (authorMatch) {
        item.author = authorMatch[1]
    }

    // Extract description after "! - "
    const descMatch = line.match(/! - (.+)$/)
    if (descMatch) {
        item.description = descMatch[1].trim()
    }

    return item
}

console.log(`✅ Found ${releases.length} releases`)

// Limit to the last 10 releases to keep build size manageable
const MAX_RELEASES = 10
const limitedReleases = releases.slice(0, MAX_RELEASES)
console.log(`🔢 Limiting to ${limitedReleases.length} most recent releases (from ${releases.length} total)`)

// Add improved categorization based on patterns and content keywords
limitedReleases.forEach(release => {
    release.changes.forEach(change => {
        change.category = categorizeChange(change.description)
    })
})

function categorizeChange(description) {
    const desc = description.toLowerCase().trim()

    // Check for specific patterns first (higher priority)
    if (desc.startsWith('fix:') || desc.startsWith('fixed:') || desc.startsWith('fixes:')) {
        return 'fix'
    }
    if (desc.startsWith('add:') || desc.startsWith('added:') || desc.startsWith('adds:')) {
        return 'feature'
    }
    if (desc.startsWith('improve:') || desc.startsWith('improved:') || desc.startsWith('improves:') ||
        desc.startsWith('enhance:') || desc.startsWith('enhanced:') || desc.startsWith('enhances:') ||
        desc.startsWith('update:') || desc.startsWith('updated:') || desc.startsWith('updates:')) {
        return 'improvement'
    }
    if (desc.includes('breaking') || desc.includes('break ') || desc.startsWith('break:')) {
        return 'breaking'
    }

    // Check for keyword-based patterns with better priority
    if (desc.includes('fix ') || desc.includes('fixed ') || desc.includes('fixes ') ||
        desc.includes('bug') || desc.includes('error') || desc.includes('issue') ||
        desc.includes('correct') || desc.includes('resolve') || desc.includes('patch')) {
        return 'fix'
    }

    if (desc.includes('add ') || desc.includes('added ') || desc.includes('adds ') ||
        desc.includes('new ') || desc.includes('introduce') || desc.includes('support for')) {
        return 'feature'
    }

    if (desc.includes('improve') || desc.includes('enhance') || desc.includes('better') ||
        desc.includes('update ') || desc.includes('updated ') || desc.includes('upgrade') ||
        desc.includes('optimize') || desc.includes('refactor') || desc.includes('cleanup')) {
        return 'improvement'
    }

    // Default fallback
    return 'other'
}

// Create output directory
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log('📁 Created output directory')
}

// Generate single releases.json file with current version and all releases
const releaseData = {
    currentVersion: limitedReleases[0]?.version || "0.0.0",
    releases: limitedReleases
}

const releasesPath = path.join(outputDir, 'releases.json')
fs.writeFileSync(releasesPath, JSON.stringify(releaseData, null, 2))

console.log(`💾 Generated releases.json with ${limitedReleases.length} releases`)
console.log(`📋 Current version: ${releaseData.currentVersion}`)
console.log('🎉 Changelog parsing completed successfully!')
