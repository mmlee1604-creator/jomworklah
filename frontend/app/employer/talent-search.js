"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getRole, locations, qualifications, roles, sharedCandidates, skillName } from "./data";
import { gapsFor, matchScore } from "./scoring";
import { Avatar, Bar, Chip, MatchRing } from "./parts";
import { ArrowIcon, LockIcon, MailIcon, SearchIcon, UserIcon } from "./icons";
import ContactDialog from "./contact-dialog";
import { useContactRequests } from "./contact-store";

const minMatchOptions = [
  { value: 0, label: "Any match" },
  { value: 40, label: "40% and above" },
  { value: 60, label: "60% and above" },
  { value: 80, label: "80% and above" }
];

const allLocations = ['All states', ...locations];
const allQualifications = ['All qualifications', ...qualifications];

export default function TalentSearch() {
  const [roleId, setRoleId] = useState(roles[0].id);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(allLocations[0]);
  const [qualification, setQualification] = useState(allQualifications[0]);
  const [minMatch, setMinMatch] = useState(0);
  const [contactFor, setContactFor] = useState(null);
  const requests = useContactRequests();

  /* The role travels in the URL so a profile's back link returns to the same
     comparison. Read after mount so the prerendered page stays fully static. */
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('role');
    if (requested && roles.some(role => role.id === requested)) setRoleId(requested);
  }, []);

  const role = getRole(roleId);

  /* Every shared candidate is scored against the selected role, then sorted by
     match so the strongest profiles surface first. */
  const rows = useMemo(() => sharedCandidates
    .map(candidate => {
      const requirements = gapsFor(candidate, role);
      const open = requirements.filter(requirement => requirement.gap > 0);
      return {
        candidate,
        match: matchScore(candidate, role),
        openGaps: open,
        keySkills: [...requirements].sort((a, b) => b.weight - a.weight).slice(0, 3)
      };
    })
    .sort((a, b) => b.match - a.match || a.candidate.name.localeCompare(b.candidate.name)),
  [role]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(({ candidate, match }) => {
      if (location !== allLocations[0] && candidate.location !== location) return false;
      if (qualification !== allQualifications[0] && candidate.qualification !== qualification) return false;
      if (match < minMatch) return false;
      if (!needle) return true;
      const haystack = [
        candidate.name, candidate.headline, candidate.field, candidate.location,
        ...candidate.interests.map(skillName)
      ].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, query, location, qualification, minMatch]);

  const hasFilters = query !== '' || location !== allLocations[0]
    || qualification !== allQualifications[0] || minMatch !== 0;

  function resetFilters() {
    setQuery('');
    setLocation(allLocations[0]);
    setQualification(allQualifications[0]);
    setMinMatch(0);
  }

  return (
    <div className="emp-page content-width">
      <div className="page-heading">
        <div>
          <p className="eyebrow"><span className="orange-dot" />Employer demo</p>
          <h1>Find candidates for your role</h1>
          <p className="lede">
            Pick the role you are hiring for. Each candidate is scored on the same evidence scale
            the candidate site uses, so the match numbers agree with what they see.
          </p>
        </div>
        <span className="chip">{sharedCandidates.length} shared profiles</span>
      </div>

      <form className="panel emp-toolbar" role="search" onSubmit={event => event.preventDefault()}>
        <label className="field emp-field-role">
          <span>Role you are hiring for</span>
          <select value={roleId} onChange={event => setRoleId(event.target.value)}>
            {roles.map(item => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </label>
        <label className="field emp-field-search">
          <span>Search profiles</span>
          <span className="emp-input">
            <SearchIcon size={16} />
            <input
              type="search"
              value={query}
              placeholder="Name, headline or interest"
              onChange={event => setQuery(event.target.value)}
            />
          </span>
        </label>
        <label className="field">
          <span>State</span>
          <select value={location} onChange={event => setLocation(event.target.value)}>
            {allLocations.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Qualification</span>
          <select value={qualification} onChange={event => setQualification(event.target.value)}>
            {allQualifications.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Minimum match</span>
          <select value={minMatch} onChange={event => setMinMatch(Number(event.target.value))}>
            {minMatchOptions.map(item => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </form>

      <div className="emp-result">
        <p role="status" aria-live="polite">
          <strong>{filtered.length}</strong> of {rows.length} candidates for {role.title}
          <span className="emp-result-role"> · {role.sector} · {role.location}</span>
        </p>
        {hasFilters && (
          <button type="button" className="button button-plain" onClick={resetFilters}>
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <section className="panel empty-state">
          <span className="tile-icon"><UserIcon size={24} /></span>
          <h2>No candidates match these filters</h2>
          <p>
            {rows.length} shared profiles were checked against {role.title}
            {location !== allLocations[0] ? ` in ${location}` : ''}
            {minMatch ? ` with a match of ${minMatch}% or above` : ''}.
          </p>
          <button type="button" className="button button-secondary" onClick={resetFilters}>
            Clear filters
          </button>
        </section>
      ) : (
        <div className="emp-grid">
          {filtered.map(({ candidate, match, openGaps, keySkills }) => (
            <article className="panel emp-card" key={candidate.id}>
              <div className="emp-card-head">
                <Avatar initials={candidate.initials} photo={candidate.photo} />
                <div className="emp-card-id">
                  <h2 className="emp-name">{candidate.name}</h2>
                  <p className="emp-headline">{candidate.headline}</p>
                </div>
                <MatchRing value={match} />
              </div>

              <div className="chips emp-chips">
                <Chip>{candidate.location}</Chip>
                <Chip>{candidate.qualification}</Chip>
                {openGaps.length > 0
                  ? <Chip accent>{openGaps.length} {openGaps.length === 1 ? 'gap' : 'gaps'}</Chip>
                  : <Chip>Meets all requirements</Chip>}
                {requests[candidate.id] && <Chip>Contacted</Chip>}
              </div>

              <ul className="emp-skills" aria-label={`Top required skills for ${role.title}`}>
                {keySkills.map(item => {
                  const level = candidate.scores[item.skillId] ?? 0;
                  return (
                    <li key={item.skillId}>
                      <div className="bar-label">
                        <span>{skillName(item.skillId)}</span>
                        <strong>{level}<span> / 5</span></strong>
                      </div>
                      <Bar value={level} className={level < item.level ? 'emp-bar-behind' : 'emp-bar-met'} />
                    </li>
                  );
                })}
              </ul>

              <div className="emp-card-actions">
                <Link
                  className="button button-secondary emp-card-cta"
                  href={`/employer/candidates/${candidate.id}?role=${role.id}`}
                >
                  View profile <ArrowIcon />
                </Link>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Contact ${candidate.name}`}
                  onClick={() => setContactFor(candidate)}
                >
                  <MailIcon />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="notice emp-notice">
        <LockIcon />
        <span>
          Only profiles shared with employers appear here; two demo profiles are withheld.
          Contact details stay hidden and requests are stored in this browser only.
        </span>
      </p>

      {contactFor && (
        <ContactDialog
          candidate={contactFor}
          role={role}
          match={matchScore(contactFor, role)}
          onClose={() => setContactFor(null)}
        />
      )}
    </div>
  );
}
