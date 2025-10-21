import React from "react"
import { render, screen } from "@testing-library/react"
import { ReleaseItemComponent } from "../ReleaseItem"
import { ReleaseItem } from "@roo-code/types"

describe("ReleaseItemComponent", () => {
	it("should render basic release item", () => {
		const item: ReleaseItem = {
			description: "Fix critical bug",
			category: "fix",
		}

		render(<ReleaseItemComponent item={item} />)
		expect(screen.getByText("• Fix critical bug")).toBeInTheDocument()
	})

	it("should render PR number with link", () => {
		const item: ReleaseItem = {
			description: "Add new feature",
			category: "feature",
			prNumber: 123,
		}

		render(<ReleaseItemComponent item={item} />)

		const prLink = screen.getByText("#123")
		expect(prLink).toBeInTheDocument()
		expect(prLink).toHaveAttribute("href", "https://github.com/kilocode/kilocode/pull/123")
		expect(prLink).toHaveAttribute("target", "_blank")
		expect(prLink).toHaveAttribute("rel", "noopener noreferrer")
	})

	it("should render commit hash with link", () => {
		const item: ReleaseItem = {
			description: "Update dependencies",
			category: "improvement",
			commitHash: "abc123def",
		}

		render(<ReleaseItemComponent item={item} />)

		const commitLink = screen.getByText("abc123def")
		expect(commitLink).toBeInTheDocument()
		expect(commitLink).toHaveAttribute("href", "https://github.com/kilocode/kilocode/commit/abc123def")
		expect(commitLink).toHaveAttribute("target", "_blank")
		expect(commitLink).toHaveAttribute("rel", "noopener noreferrer")
	})

	it("should render author with link", () => {
		const item: ReleaseItem = {
			description: "Refactor code",
			category: "improvement",
			author: "test-user",
		}

		render(<ReleaseItemComponent item={item} />)

		expect(screen.getByText("by")).toBeInTheDocument()

		const authorLink = screen.getByText("@test-user")
		expect(authorLink).toBeInTheDocument()
		expect(authorLink).toHaveAttribute("href", "https://github.com/test-user")
		expect(authorLink).toHaveAttribute("target", "_blank")
		expect(authorLink).toHaveAttribute("rel", "noopener noreferrer")
	})

	it("should handle author with hyphens", () => {
		const item: ReleaseItem = {
			description: "Fix edge case",
			category: "fix",
			author: "shameez-struggles-to-commit",
		}

		render(<ReleaseItemComponent item={item} />)

		const authorLink = screen.getByText("@shameez-struggles-to-commit")
		expect(authorLink).toBeInTheDocument()
		expect(authorLink).toHaveAttribute("href", "https://github.com/shameez-struggles-to-commit")
	})

	it("should render all metadata together", () => {
		const item: ReleaseItem = {
			description: "Comprehensive change",
			category: "feature",
			prNumber: 456,
			commitHash: "xyz789",
			author: "full-contributor",
		}

		render(<ReleaseItemComponent item={item} />)

		expect(screen.getByText("• Comprehensive change")).toBeInTheDocument()
		expect(screen.getByText("#456")).toBeInTheDocument()
		expect(screen.getByText("xyz789")).toBeInTheDocument()
		expect(screen.getByText("@full-contributor")).toBeInTheDocument()
	})

	it("should handle missing optional metadata gracefully", () => {
		const item: ReleaseItem = {
			description: "Simple change",
			category: "other",
		}

		render(<ReleaseItemComponent item={item} />)

		expect(screen.getByText("• Simple change")).toBeInTheDocument()
		expect(screen.queryByText(/^#/)).not.toBeInTheDocument()
		expect(screen.queryByText(/^@/)).not.toBeInTheDocument()
		expect(screen.queryByText("by")).not.toBeInTheDocument()
	})
})
