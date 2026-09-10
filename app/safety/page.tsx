import { InfoPage } from "@/components/InfoPage";

export default function SafetyPage() {
  return (
    <InfoPage title="Safety / Disclaimer" subtitle="Please read before making any payment or transaction.">
      <div>
        <h2>We don't verify anything</h2>
        <p>
          OwnerToBuyer does not verify property ownership, legal documents, approvals, NOCs, outstanding dues, or the
          accuracy of anything a seller or dealer provides. Anyone can create an account and post a listing. Treat
          every listing as unverified until you've checked it yourself.
        </p>
      </div>
      <div>
        <h2>Before you pay a rupee</h2>
        <ul>
          <li>Visit the property in person before agreeing to anything</li>
          <li>Verify ownership documents directly with the relevant land/society authority</li>
          <li>Never send money — token, advance, or otherwise — before verifying documents and meeting in person</li>
          <li>Be extremely wary of any seller who refuses a site visit or rushes you to pay quickly</li>
          <li>Use a proper written agreement for any deal, ideally reviewed by a lawyer</li>
        </ul>
      </div>
      <div>
        <h2>Common scam patterns to watch for</h2>
        <ul>
          <li>Prices far below market rate for the area</li>
          <li>Sellers who are "out of town" and can only deal over phone/WhatsApp</li>
          <li>Requests for a booking/token payment before you've seen the property</li>
          <li>Pressure to decide immediately because "someone else is interested"</li>
        </ul>
      </div>
      <div>
        <h2>If something looks wrong</h2>
        <p>
          Use the <strong>Report this listing</strong> button on the property page. Our team reviews reports and can
          hide listings or block accounts that are confirmed to be fraudulent — but that review happens after the
          fact, so it doesn't replace your own due diligence beforehand.
        </p>
      </div>
    </InfoPage>
  );
}
