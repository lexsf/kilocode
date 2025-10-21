import React from "react"
import { render, screen } from "@testing-library/react"
import { ReleaseNoteDisplay } from "../ReleaseNoteDisplay"
import { ReleaseNote } from "@roo-code/types"

const mockRelease: ReleaseNote = {
	version: "4.106.0",
	changes: [
		{
			description: "Add new awesome feature",
			category: "feature",
			prNumber: 123,
			commitHash: "abc123",
			author: "test-user",
		},
		{
			description: "Fix critical bug",
			category: "fix",
			prNumber: 124,
			commitHash: "def456",
		},
		{
			description: "Improve performance",
			category: "improvement",
			author: "another-user",
		},
		{
			description: "Breaking API change",
			category: "breaking",
			prNumber: 125,
		},
		{
			description: "Other misc change",
			category: "other",
		},
	],
}

describe("ReleaseNoteDisplay", () => {
	it("should render version number", () => {
		render(<ReleaseNoteDisplay release={mockRelease} />)
		expect(screen.getByText("v4.106.0")).toBeInTheDocument()
	})

	it("should show latest badge when isLatest is true", () => {
		render(<ReleaseNoteDisplay release={mockRelease} isLatest={true} />)
		expect(screen.getByText("Latest")).toBeInTheDocument()
	})

	it("should not show latest badge when isLatest is false", () => {
		render(<ReleaseNoteDisplay release={mockRelease} isLatest={false} />)
		expect(screen.queryByText("Latest")).not.toBeInTheDocument()
	})

	it("should categorize changes correctly", () => {
		render(<ReleaseNoteDisplay release={mockRelease} />)

		// Check that sections appear
		expect(screen.getByText("New Features")).toBeInTheDocument()
		expect(screen.getByText("Bug Fixes")).toBeInTheDocument()
		expect(screen.getByText("Improvements")).toBeInTheDocument()
		expect(screen.getByText("Breaking Changes")).toBeInTheDocument()
		expect(screen.getByText("Other Changes")).toBeInTheDocument()

		// Check that changes are in correct sections
		expect(screen.getByText(/Add new awesome feature/)).toBeInTheDocument()
		expect(screen.getByText(/Fix critical bug/)).toBeInTheDocument()
		expect(screen.getByText(/Improve performance/)).toBeInTheDocument()
		expect(screen.getByText(/Breaking API change/)).toBeInTheDocument()
		expect(screen.getByText(/Other misc change/)).toBeInTheDocument()
	})

	it("should render PR links correctly", () => {
		render(<ReleaseNoteDisplay release={mockRelease} />)

		const prLink = screen.getByText("#123")
		expect(prLink).toBeInTheDocument()
		expect(prLink).toHaveAttribute("href", "https://github.com/kilocode/kilocode/pull/123")
	})

	it("should render commit links correctly", () => {
		render(<ReleaseNoteDisplay release={mockRelease} />)

		const commitLink = screen.getByText("abc123")
		expect(commitLink).toBeInTheDocument()
		expect(commitLink).toHaveAttribute("href", "https://github.com/kilocode/kilocode/commit/abc123")
	})

	it("should render author links correctly", () => {
		render(<ReleaseNoteDisplay release={mockRelease} />)

		const authorLink = screen.getByText("@test-user")
		expect(authorLink).toBeInTheDocument()
		expect(authorLink).toHaveAttribute("href", "https://github.com/test-user")
	})

	it("should handle empty changes array", () => {
		const emptyRelease: ReleaseNote = {
			version: "1.0.0",
			changes: [],
		}

		render(<ReleaseNoteDisplay release={emptyRelease} />)
		expect(screen.getByText("v1.0.0")).toBeInTheDocument()

		// Sections should not appear when empty
		expect(screen.queryByText("New Features")).not.toBeInTheDocument()
		expect(screen.queryByText("Bug Fixes")).not.toBeInTheDocument()
		expect(screen.queryByText("Improvements")).not.toBeInTheDocument()
		expect(screen.queryByText("Breaking Changes")).not.toBeInTheDocument()
		expect(screen.queryByText("Other Changes")).not.toBeInTheDocument()
	})
})
