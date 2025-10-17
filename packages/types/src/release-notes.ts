export interface ReleaseItem {
	description: string
	prNumber?: number
	commitHash?: string
	author?: string
	category: ReleaseItemCategory
}

export type ReleaseItemCategory = "feature" | "fix" | "improvement" | "breaking" | "other"

export interface ReleaseNote {
	version: string
	changes: ReleaseItem[]
}

export interface ReleaseData {
	currentVersion: string
	releases: ReleaseNote[]
}
