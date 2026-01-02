import {render, screen} from "@testing-library/react";
import PersistentDrawerLeft from "@/app/dashboard/page";

describe('Insights tab', () => {
  it.each`
    description                      | expected
    ${'Pairing index title'}         | ${'Pairing Index'}
  `('should render $description', async ({expected}) => {
    render(<PersistentDrawerLeft />);

    const heading = await screen.findByText(expected);

    expect(heading).toBeInTheDocument()
  });
})
