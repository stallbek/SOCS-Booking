import { useEffect, useState } from 'react';
import { apiRequest } from '../api/api';

function UserSearch({ onSelectUser, placeholder = "Search users..." }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!query) {
        setResults([]);
        return;
      }

      try {
        const data = await apiRequest(`/users/search?q=${query}`);
        setResults(data);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="user-search">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />

      {results.length > 0 && (
        <div className="user-search-results">
          {results.map((user) => (
            <div
              key={user._id}
              className="user-search-item"
              onClick={() => onSelectUser(user)}
            >
              {user.name} ({user.email})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserSearch;