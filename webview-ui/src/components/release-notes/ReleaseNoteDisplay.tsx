// kilocode_change - new file: Component to display a complete release note with sections
import React, { useMemo } from "react"
import { Sparkles, Bug, Wrench, AlertTriangle, FileText } from "lucide-react"
import { ReleaseNote } from "@roo-code/types"
import { ReleaseSection } from "./ReleaseSection"

const REPOSITORY_URL = "https://github.com/kilocode/kilocode"

interface ReleaseNoteDisplayProps {
	release: ReleaseNote
	isLatest?: boolean
}

export const ReleaseNoteDisplay: React.FC<ReleaseNoteDisplayProps> = ({ release, isLatest }) => {
	const { version, changes } = release

	// Categorize changes based on their category field
	const categorizedChanges = useMemo(() => {
		const features = changes.filter((item) => item.category === "feature")
		const fixes = changes.filter((item) => item.category === "fix")
		const improvements = changes.filter((item) => item.category === "improvement")
		const breakingChanges = changes.filter((item) => item.category === "breaking")
		const others = changes.filter((item) => item.category === "other")

		return { features, fixes, improvements, breakingChanges, others }
	}, [changes])

	const { features, fixes, improvements, breakingChanges, others } = categorizedChanges

	return (
		<div className="mb-6 pb-4 border-b border-vscode-panel-border last:border-b-0">
			<div className="flex items-center gap-2 mb-3">
				<a
					href={`${REPOSITORY_URL}/releases/tag/v${version}`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-lg font-medium text-vscode-textLink-foreground hover:text-vscode-textLink-activeForeground underline">
					v{version}
				</a>
				{isLatest && (
					<span className="px-2 py-1 text-xs bg-vscode-button-background text-vscode-button-foreground rounded">
						Latest
					</span>
				)}
			</div>

			<ReleaseSection
				title="New Features"
				items={features}
				icon={<Sparkles className="w-4 h-4 text-vscode-textLink-foreground" />}
			/>

			<ReleaseSection
				title="Bug Fixes"
				items={fixes}
				icon={<Bug className="w-4 h-4 text-vscode-errorForeground" />}
			/>

			<ReleaseSection
				title="Improvements"
				items={improvements}
				icon={<Wrench className="w-4 h-4 text-vscode-textLink-foreground" />}
			/>

			<ReleaseSection
				title="Breaking Changes"
				items={breakingChanges}
				icon={<AlertTriangle className="w-4 h-4 text-vscode-errorForeground" />}
			/>

			{/* Show uncategorized items */}
			<ReleaseSection
				title="Other Changes"
				items={others}
				icon={<FileText className="w-4 h-4 text-vscode-descriptionForeground" />}
			/>
		</div>
	)
}
