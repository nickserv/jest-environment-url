import { screen } from "@testing-library/dom"
import "@testing-library/jest-dom"

test("URLEnvironment", () => {
  expect(location.href).toBe("https://example.com/")
  expect(screen.getByText("Example Domain")).toBeInTheDocument()
})
