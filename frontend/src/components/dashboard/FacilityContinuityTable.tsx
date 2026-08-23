interface FacilityMetrics {
  facilityId: string;
  facilityName: string;
  totalReferrals: number;
  completionRatePercent: number;
  avgReferralDelayHours: number;
  followUpCompliancePercent: number;
}

interface FacilityContinuityTableProps {
  facilities: FacilityMetrics[];
  // thresholds are configurable, not hardcoded magic numbers buried in JSX
  completionRateAlertBelow?: number;
  followUpComplianceAlertBelow?: number;
  delayAlertAboveHours?: number;
}

/**
 * Build Guide Section 5: "the dashboard should answer decisions, not
 * display numbers." Every row here is something a district officer can
 * act on directly — this table is the literal implementation of the
 * Facility A/B/C example in the guide.
 */
export function FacilityContinuityTable({
  facilities,
  completionRateAlertBelow = 80,
  followUpComplianceAlertBelow = 70,
  delayAlertAboveHours = 12,
}: FacilityContinuityTableProps) {
  return (
    <table className="facility-continuity-table">
      <caption>Referral Continuity by Facility</caption>
      <thead>
        <tr>
          <th>Facility</th>
          <th>Total Referrals</th>
          <th>Completion Rate</th>
          <th>Avg Referral Delay</th>
          <th>Follow-up Compliance</th>
        </tr>
      </thead>
      <tbody>
        {facilities.map((f) => {
          const completionAlert = f.completionRatePercent < completionRateAlertBelow;
          const delayAlert = f.avgReferralDelayHours > delayAlertAboveHours;
          const followUpAlert = f.followUpCompliancePercent < followUpComplianceAlertBelow;

          return (
            <tr key={f.facilityId} className={completionAlert || delayAlert || followUpAlert ? "row--alert" : ""}>
              <td>{f.facilityName}</td>
              <td>{f.totalReferrals}</td>
              <td className={completionAlert ? "cell--alert" : ""}>
                {f.completionRatePercent.toFixed(0)}%
                {completionAlert && <AlertTag />}
              </td>
              <td className={delayAlert ? "cell--alert" : ""}>
                {f.avgReferralDelayHours.toFixed(1)}h
                {delayAlert && <AlertTag />}
              </td>
              <td className={followUpAlert ? "cell--alert" : ""}>
                {f.followUpCompliancePercent.toFixed(0)}%
                {followUpAlert && <AlertTag />}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function AlertTag() {
  return <span className="alert-tag">ALERT</span>;
}
