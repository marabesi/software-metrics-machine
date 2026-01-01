import {render, screen} from "@testing-library/react";
import PersistentDrawerLeft from "@/app/dashboard/page";

describe('Dashboard', () => {
  it.each`
    description                      | expected
    ${'repository under inspection'} | ${'Persistent drawer'}
    ${'tab insights'}                | ${'Insights'}
  `('should render $description', ({expected}) => {
    render(<PersistentDrawerLeft />);

    const heading = screen.getByText(expected);

    expect(heading).toBeInTheDocument()
  });
})
