import { InfoPage } from "@/components/InfoPage";

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" subtitle="Last updated: September 2026">
      <div>
        <h2>1. What we collect</h2>
        <ul>
          <li>Account info: name, email, phone number, account type, bio, and profile photo</li>
          <li>Listing content: property details, and photos you upload</li>
          <li>Usage data: your favorites, saved searches, and reports you file</li>
          <li>
            Contact activity: when you tap WhatsApp/Call on a listing, we log that a contact happened (not the
            content of the call or chat) so sellers can see interest in their listing
          </li>
        </ul>
      </div>
      <div>
        <h2>2. How we use it</h2>
        <p>
          To run the platform: showing your listings to buyers, letting sellers see interest in their properties,
          authenticating your account, and moderating reported content. We don't sell your personal data.
        </p>
      </div>
      <div>
        <h2>3. What's public</h2>
        <p>
          Your name, account type, and any phone number you add to your profile are shown to other users on your
          listings so they can contact you directly — that's how the platform works. Your email address is never
          shown publicly.
        </p>
      </div>
      <div>
        <h2>4. Blocked or removed accounts</h2>
        <p>
          If your account is blocked by an administrator, your profile and listings are hidden from other users, but
          your data is retained so the block can be reviewed or reversed. We don't permanently delete account data
          on a block — only on request.
        </p>
      </div>
      <div>
        <h2>5. Data storage</h2>
        <p>
          Your data is stored with Supabase (hosted on their infrastructure) with database-level access controls
          restricting who can read what.
        </p>
      </div>
      <div>
        <h2>6. Your choices</h2>
        <p>
          You can edit or remove most of your profile information at any time from your Profile page, and delete
          individual listings from My Properties. To request full account deletion, contact us at{" "}
          <a href="/contact">the address on our Contact page</a>.
        </p>
      </div>
    </InfoPage>
  );
}
