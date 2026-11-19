"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCandidate, getRole, roles, skillName } from "./data";
import { bestRole, gapsFor, matchScore } from "./scoring";
import { Avatar, Bar, Chip, MatchRing } from "./parts";
import { ArrowIcon, CheckIcon, LockIcon, MailIcon } from "./icons";
import ContactDialog from "./contact-dialog";
import { useContactRequests, withdrawRequest } from "./contact-store";

function firstName(name) {
  return name.split(/\s+/)[0];
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CandidateProfile({ id }) {
  const candidate = getCandidate(id);
  const [roleId, setRoleId] = useState(() => bestRole(candidate, roles).id);
  const [contactOpen, setContactOpen] = useState(false);
  const requests = useContactRequests();
  const request = requests[candidate.id];

  /* A profile opened from the search grid carries ?role=. Read it after mount so
     the prerendered profile is complete on first paint. */
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('role');
    if (requested && roles.some(role => role.id === requested)) setRoleId(requested);
  }, []);

  const role = getRole(roleId);

  const requirements = gapsFor(candidate, role);
  const openGaps = requirements.filter(item => item.gap > 0);
  const match = matchScore(candidate, role);

  /* Evidence for skills this role cares about comes first, then the rest by level. */
  const evidence = [...candidate.evidence].sort((a, b) => {
    const indexA = requirements.findIndex(item => item.skillId === a.skillId);
    const indexB = requirements.findIndex(item => item.skillId === b.skillId);
    if (indexA !== indexB) return (indexA < 0 ? 99 : indexA) - (indexB < 0 ? 99 : indexB);
    return b.level - a.level;
  });

  const rankedRoles = roles
    .map(item => ({ ...item, match: matchScore(candidate, item) }))
    .sort((a, b) => b.match - a.match || a.title.localeCompare(b.title));

  return (
    <div className="emp-page content-width emp-profile">
      <Link className="button button-plain emp-back" href={`/employer?role=${role.id}`}>
        <ArrowIcon /> Back to candidate search
      </Link>

      <div className="page-heading emp-profile-head">
        <div className="emp-profile-id">
          <Avatar initials={candidate.initials} photo={candidate.photo} size="lg" />
          <div>
            <p className="eyebrow"><span className="orange-dot" />Candidate for {role.title}</p>
            <h1>{candidate.name}</h1>
            <p className="lede">{candidate.headline}. {candidate.location}.</p>
          </div>
        </div>
        <div className="emp-match">
          <MatchRing value={match} />
          <span>Match for {role.title}</span>
        </div>
      </div>

      <div className="chips emp-chips">
        <Chip>{candidate.qualification} · {candidate.field}</Chip>
        <Chip>{candidate.location}</Chip>
        <Chip>{candidate.availability}</Chip>
        <Chip>Roadmap phase {candidate.roadmap.phase}</Chip>
        {openGaps.length === 0
          ? <Chip>Meets every requirement</Chip>
          : <Chip accent>{openGaps.length} {openGaps.length === 1 ? 'gap' : 'gaps'} for this role</Chip>}
      </div>

      {request ? (
        <div className="panel emp-contact-status">
          <div>
            <p className="label">Request sent</p>
            <p><strong>{request.roleTitle}</strong> · {formatDate(request.sentAt)}</p>
            <p className="emp-contact-copy">
              Waiting for {firstName(candidate.name)} to accept. Contact details stay hidden until then.
            </p>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => withdrawRequest(candidate.id)}
          >
            Withdraw request
          </button>
        </div>
      ) : (
        <div className="emp-actions">
          <button type="button" className="button button-primary" onClick={() => setContactOpen(true)}>
            <MailIcon /> Contact candidate
          </button>
          <span className="emp-contact-note">
            {firstName(candidate.name)} chooses whether to share contact details.
          </span>
        </div>
      )}

      <div className="emp-columns">
        <div className="emp-stack">
          <section className="panel emp-section">
            <h2>Skill evidence</h2>
            <p className="emp-section-note">
              Each score comes from evidence recorded in the profile, from 0 (none) to 5 (verified).
              The level this role expects is shown alongside.
            </p>
            <ul className="emp-evidence">
              {evidence.map(item => {
                const expected = requirements.find(requirement => requirement.skillId === item.skillId);
                const behind = expected && item.level < expected.level;
                return (
                  <li key={item.skillId}>
                    <div className="bar-label">
                      <span>
                        {skillName(item.skillId)}
                        {expected && <span className="emp-req">needs {expected.level}</span>}
                      </span>
                      <strong>{item.level}<span> / 5</span></strong>
                    </div>
                    <Bar value={item.level} className={expected ? (behind ? 'emp-bar-behind' : 'emp-bar-met') : ''} />
                    <p className="emp-evidence-source">
                      <span>{item.source}</span>
                      {item.verified && (
                        <span className="emp-verified"><CheckIcon size={11} />Verified</span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="panel emp-section">
            <h2>Portfolio</h2>
            <p className="emp-section-note">Work the candidate has chosen to share with employers.</p>
            <ul className="emp-portfolio">
              {candidate.portfolio.map(item => (
                <li key={item.title}>
                  <span className="emp-portfolio-type">{item.type}</span>
                  <h3>{item.title}</h3>
                  <div className="chips">
                    {item.skills.map(skillId => <Chip key={skillId}>{skillName(skillId)}</Chip>)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="emp-stack">
          <section className="panel emp-section">
            <h2>Gaps for this role</h2>
            <p className="emp-section-note">
              {openGaps.length === 0
                ? `Every requirement for ${role.title} is already met.`
                : `${openGaps.length} of ${requirements.length} requirements are not met yet. Sorted by how much the role depends on each skill.`}
            </p>
            <ul className="emp-gaps">
              {requirements.map(item => (
                <li key={item.skillId} className={`emp-gap${item.gap === 0 ? ' is-met' : ''}`}>
                  <span className="emp-gap-name">{skillName(item.skillId)}</span>
                  <span className="emp-gap-levels">{item.current} of {item.level}</span>
                  <strong className="emp-gap-value">{item.gap === 0 ? 'Met' : `-${item.gap}`}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel emp-section">
            <h2>Roadmap progress</h2>
            <div className="emp-roadmap">
              <div className="bar-label">
                <span>Phase {candidate.roadmap.phase} · learning tasks</span>
                <strong>{candidate.roadmap.done}<span> / {candidate.roadmap.total}</span></strong>
              </div>
              <Bar value={candidate.roadmap.done} maximum={candidate.roadmap.total} />
              <p className="emp-section-note">
                Progress on the plan the candidate built for their target role.
                Tasks completed are reported by the candidate, not assessed here.
              </p>
            </div>
          </section>

          <section className="panel emp-section">
            <h2>Fit across roles</h2>
            <p className="emp-section-note">The same evidence scored against every entry-level role in the demo.</p>
            <table className="emp-rolefit">
              <caption className="sr-only">Match against every entry-level role</caption>
              <thead>
                <tr>
                  <th scope="col">Role</th>
                  <th scope="col">Match</th>
                </tr>
              </thead>
              <tbody>
                {rankedRoles.map(item => (
                  <tr key={item.id} aria-current={item.id === role.id ? 'true' : undefined}>
                    <th scope="row">{item.title}</th>
                    <td>{item.match}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>

      <p className="notice emp-notice">
        <LockIcon />
        <span>
          Illustrative demo profile. Contact details are withheld and the scores are generated from
          sample evidence, so they are not a hiring decision or a verification of the candidate.
          Contact requests are stored in this browser only.
        </span>
      </p>

      {contactOpen && (
        <ContactDialog
          candidate={candidate}
          role={role}
          match={match}
          onClose={() => setContactOpen(false)}
        />
      )}
    </div>
  );
}
