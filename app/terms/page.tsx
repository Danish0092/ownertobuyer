import { InfoPage } from "@/components/InfoPage";

export default function TermsPage() {
  return (
    <InfoPage title="Terms & Conditions" subtitle="Last updated: September 2026">
      <div>
        <h2>1. What OwnerToBuyer is</h2>
        <p>
          OwnerToBuyer is a listings platform that lets property owners advertise properties for sale or
          rent, and lets buyers/renters browse and contact them directly. We are not a real estate agency, broker,
          agent, or party to any transaction between users.
        </p>
      </div>
      <div>
        <h2>2. Your account</h2>
        <p>
          You must provide accurate information when creating an account and posting a listing. You're responsible
          for everything posted under your account. We may suspend or block accounts that post fraudulent listings,
          impersonate someone else, or otherwise abuse the platform.
        </p>
      </div>
      <div>
        <h2>3. Posting a listing</h2>
        <p>
          Listings must be for real, existing properties that you own or are authorized to list. Posting is free,
          and we don't take a commission on any resulting deal. We may remove any listing that violates these terms,
          appears fraudulent, or is reported and found to be misleading.
        </p>
      </div>
      <div>
        <h2>4. No verification, no warranty</h2>
        <p>
          We do not verify property ownership, legal documents, approvals, NOCs, dues, or the accuracy of anything a
          seller provides. All information on the platform is provided "as is" by the user who posted it. See our{" "}
          <a href="/safety">Safety / Disclaimer</a> page for details.
        </p>
      </div>
      <div>
        <h2>5. Transactions are between users</h2>
        <p>
          Any negotiation, payment, or transfer of property happens directly between buyer and seller. OwnerToBuyer
          is not involved in, and has no liability for, the outcome of any transaction.
        </p>
      </div>
      <div>
        <h2>6. Prohibited use</h2>
        <ul>
          <li>Posting fake, duplicate, or misleading listings</li>
          <li>Impersonating another person or business</li>
          <li>Using the platform to harass, spam, or defraud other users</li>
          <li>Scraping or bulk-collecting listing or contact data</li>
        </ul>
      </div>
      <div>
        <h2>7. Changes to these terms</h2>
        <p>We may update these terms from time to time; continued use of the platform means you accept the current version.</p>
      </div>
    </InfoPage>
  );
}
