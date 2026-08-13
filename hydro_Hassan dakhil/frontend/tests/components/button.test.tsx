import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../../src/components/ui/button";

describe("frontend Button", () => {
  it("renders a simple button", () => {
    render(<Button>Enregistrer</Button>);

    expect(
      screen.getByRole("button", {
        name: "Enregistrer",
      })
    ).toBeInTheDocument();
  });
});
