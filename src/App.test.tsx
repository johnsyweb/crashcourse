import { render, screen, within } from '@testing-library/react';
import App from './App';

jest.mock('./CourseSimulationApp', () => ({
  __esModule: true,
  default: () => <div data-testid="course-simulation-app">Course simulation</div>,
}));

describe('App', () => {
  it('renders skip link to main content', () => {
    render(<App />);
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#content');
    expect(skipLink).toHaveClass('skip-link');
  });

  it('renders header with title and tagline', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Crashcourse' })).toBeInTheDocument();
    expect(
      screen.getByText('Simulate and analyse your event course for accessibility and enjoyment.')
    ).toBeInTheDocument();
  });

  it('renders breadcrumbs with johnsy.com, parkrun utilities, and current page', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toBeInTheDocument();

    const johnsyLink = screen.getByRole('link', { name: 'johnsy.com' });
    expect(johnsyLink).toHaveAttribute('href', 'https://www.johnsy.com/');

    const utilitiesLink = screen.getByRole('link', { name: 'parkrun utilities' });
    expect(utilitiesLink).toHaveAttribute('href', 'https://www.johnsy.com/parkrun-utilities/');

    expect(
      screen.getByText('Crashcourse', { selector: '[aria-current="page"]' })
    ).toBeInTheDocument();
  });

  it('renders main content with id for skip link target', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'content');
    expect(screen.getByTestId('course-simulation-app')).toBeInTheDocument();
  });

  it('renders footer with credit and links', () => {
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('app-footer');

    expect(within(footer).getByText('Crashcourse')).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'Pete Johns' })).toHaveAttribute(
      'href',
      'https://www.johnsy.com'
    );
    expect(within(footer).getByRole('link', { name: '@johnsyweb' })).toHaveAttribute(
      'href',
      'https://github.com/johnsyweb'
    );
    expect(within(footer).getByText(/Licensed under MIT/)).toBeInTheDocument();
    expect(within(footer).getByText(/Not officially associated with parkrun/)).toBeInTheDocument();
    expect(
      within(footer).getByText(/Written by parkrun volunteers for parkrun volunteers/)
    ).toBeInTheDocument();

    const versionLink = within(footer).getByRole('link', {
      name: /v[\d.]+/,
    });
    expect(versionLink).toHaveAttribute(
      'href',
      'https://github.com/johnsyweb/crashcourse/blob/main/CHANGELOG.md'
    );
  });
});
