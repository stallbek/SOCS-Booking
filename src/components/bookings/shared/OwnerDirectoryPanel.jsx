
//Stalbek Ulanbek uulu 261102435
import LookupPanel from './LookupPanel';
import { getItemId } from '../../../utils/bookings';

function OwnerDirectoryPanel({
  filteredOwners,
  loadingOwners,
  onClearSearch,
  onSearchChange,
  onSelectOwner,
  ownerSearch,
  owners,
  selectedOwnerId
}) {
  return (
    <LookupPanel
      eyebrow="Search owners"
      fieldLabel="Search owners"
      heading="Owners"
      onChange={onSearchChange}
      placeholder="Search by name"
      value={ownerSearch}
    >
      {loadingOwners ? (
        <div className="dashboard-empty-state">
          <h3>Loading owners</h3>
          <p>Checking the owner directory.</p>
        </div>
      ) : !owners.length ? (
        <div className="dashboard-empty-state">
          <h3>No owners found</h3>
          <p>No owner accounts are available in the booking directory yet.</p>
        </div>
      ) : ownerSearch.trim() ? (
        filteredOwners.length ? (
          <div className="owner-directory-grid">
            {filteredOwners.map((owner) => {
              const ownerId = getItemId(owner);
              const isSelected = ownerId === selectedOwnerId;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`owner-directory-item${isSelected ? ' owner-directory-item-active' : ''}`}
                  key={ownerId}
                  onClick={() => onSelectOwner(ownerId)}
                  type="button"
                >
                  <span className="owner-directory-label">Owner</span>
                  <strong>{owner.name}</strong>
                  <span>{owner.email}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="dashboard-empty-state">
            <h3>No owners match</h3>
            <p>Try another name or clear the search.</p>
            <button className="text-link dashboard-show-all" onClick={onClearSearch} type="button">
              Clear search
            </button>
          </div>
        )
      ) : null}
    </LookupPanel>
  );
}

export default OwnerDirectoryPanel;
