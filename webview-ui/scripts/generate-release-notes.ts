#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { unified } from "unified"
import remarkParse from "remark-parse"
import { visit } from "unist-util-visit"
import type { Root, ListItem, Link, Text } from "mdast"
import type { ReleaseNote, ReleaseItem, ReleaseItemCategory, ReleaseData } from "@roo-code/types"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("🚀 Starting changelog parsing...")

// Paths
const changelogPath = path.resolve(__dirname, "../../CHANGELOG.md")
const outputDir = path.resolve(__dirname, "../src/generated/releases")

console.log("📖 Reading changelog from:", changelogPath)
console.log("📁 Output directory:", outputDir)

// Check if changelog exists
if (!fs.existsSync(changelogPath)) {
	console.error("❌ Changelog not found at:", changelogPath)
	process.exit(1)
}

// Read changelog
const changelogContent = fs.readFileSync(changelogPath, "utf-8")
console.log("📄 Changelog loaded, length:", changelogContent.length, "characters")

// Parse markdown using remark
const ast = unified().use(remarkParse).parse(changelogContent) as Root

// Extract release notes from the AST
const releases: ReleaseNote[] = []
let currentRelease: ReleaseNote | null = null

visit(ast, (node, _index, parent) => {
	// Look for version headers like ## [v4.106.0]
	if (node.type === "heading" && node.depth === 2) {
		const headingText = extractTextFromNode(node)
		const versionMatch = headingText.match(/^\[v(\d+\.\d+\.\d+)\]/)

		if (versionMatch) {
			if (currentRelease) {
				releases.push(currentRelease)
			}

			currentRelease = { version: versionMatch[1], changes: [] }
			console.log(`📝 Found release v${currentRelease.version}`)
		}
	}

	// Look for list items (changelog entries)
	if (node.type === "list" && currentRelease && parent?.type === "root") {
		visit(node, "listItem", (listItem: ListItem) => {
			const changeItem = extractChangeFromListItem(listItem)
			if (changeItem) {
				currentRelease!.changes.push(changeItem)
			}
		})
	}
})

// Don't forget the last release
if (currentRelease) {
	releases.push(currentRelease)
}

function extractTextFromNode(node: any): string {
	let text = ""
	visit(node, "text", (textNode: Text) => {
		text += textNode.value
	})
	return text
}

function extractChangeFromListItem(listItem: ListItem): ReleaseItem | null {
	let description = ""
	let prNumber: number | undefined
	let commitHash: string | undefined
	let author: string | undefined

	// Extract all text and metadata from the list item
	visit(listItem, (node) => {
		if (node.type === "text") {
			description += node.value
		} else if (node.type === "link") {
			const link = node as Link
			const linkText = extractTextFromNode(link)

			// Check for PR links [#123]
			const prMatch = linkText.match(/^#(\d+)$/)
			if (prMatch) {
				prNumber = parseInt(prMatch[1])
			}

			// Check for commit links [`abc123`]
			const commitMatch = linkText.match(/^`([a-f0-9]+)`$/)
			if (commitMatch) {
				commitHash = commitMatch[1]
			}

			// Check for author links [@username]
			const authorMatch = linkText.match(/^@(\w+)$/)
			if (authorMatch) {
				author = authorMatch[1]
			}
		}
	})

	// Clean up description
	description = description.trim()

	// Extract description after "! - " pattern
	const descMatch = description.match(/! - (.+)$/)
	if (descMatch) {
		description = descMatch[1].trim()
	}

	// Skip empty entries
	if (!description) {
		return null
	}

	// Determine category
	const category = categorizeChange(description)

	return {
		description,
		category,
		...(prNumber && { prNumber }),
		...(commitHash && { commitHash }),
		...(author && { author }),
	}
}

function categorizeChange(description: string): ReleaseItemCategory {
	const desc = description.toLowerCase()

	if (desc.includes("fix") || desc.includes("bug")) {
		return "fix"
	} else if (desc.includes("break")) {
		return "breaking"
	} else if (desc.includes("add") || desc.includes("new")) {
		return "feature"
	} else if (desc.includes("improve") || desc.includes("update") || desc.includes("enhance")) {
		return "improvement"
	} else {
		return "other"
	}
}

console.log(`✅ Found ${releases.length} releases`)

// Limit to the last 10 releases to keep build size manageable
const MAX_RELEASES = 10
const limitedReleases = releases.slice(0, MAX_RELEASES)
console.log(`🔢 Limiting to ${limitedReleases.length} most recent releases (from ${releases.length} total)`)

// Create output directory
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true })
	console.log("📁 Created output directory")
}

// Generate single releases.json file with current version and recent releases
const releaseData: ReleaseData = {
	currentVersion: limitedReleases[0]?.version || "0.0.0",
	releases: limitedReleases,
}

const releasesPath = path.join(outputDir, "releases.json")
fs.writeFileSync(releasesPath, JSON.stringify(releaseData, null, 2))
console.log(`💾 Generated releases.json with ${limitedReleases.length} releases`)
console.log(`📋 Current version: ${releaseData.currentVersion}`)

// Log sample of extracted changes
if (limitedReleases.length > 0) {
	const sampleRelease = limitedReleases[0]
	console.log(`📝 Sample: v${sampleRelease.version} has ${sampleRelease.changes.length} changes`)
	if (sampleRelease.changes.length > 0) {
		console.log(`   First change: "${sampleRelease.changes[0].description.slice(0, 80)}..."`)
	}
}

console.log("🎉 Changelog parsing completed successfully!")
