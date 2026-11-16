import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-5xl font-semibold">Page not found</h1>
      <p className="mt-3 opacity-75">Let's breathe and go back home.</p>
      <Link to="/" className="btn-primary mt-6">
        Home
      </Link>
    </div>
  );
}
