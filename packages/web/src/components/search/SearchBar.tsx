import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  initialValue?: string;
  onSearch?: (q: string) => void;
  placeholder?: string;
  autoNavigate?: boolean;
}

export default function SearchBar({ initialValue = '', onSearch, placeholder, autoNavigate }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (autoNavigate) {
      void navigate(`/search?q=${encodeURIComponent(value)}`);
    } else {
      onSearch?.(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? 'Search CDS views by name, description, or field…'}
        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
