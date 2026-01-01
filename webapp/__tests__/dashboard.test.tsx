import {render, screen} from "@testing-library/react";
import PersistentDrawerLeft from "@/app/dashboard/page";

describe('Dashboard', () => {
  it('should render the repository under inspection', () => {
    render(<PersistentDrawerLeft />);

    const heading = screen.getByText('Persistent drawer');

    expect(heading).toBeInTheDocument()
  });
})