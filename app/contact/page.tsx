import { InfoPage } from "@/components/InfoPage";

// support@ownertobuyer.com is a placeholder — swap it for a real,
// monitored address before this goes live.
export default function ContactPage() {
  return (
    <InfoPage title="Contact Us" subtitle="Questions, feedback, or something to report? We're listening.">
      <div>
        <h2>Email</h2>
        <p>
          <a href="mailto:support@ownertobuyer.com">support@ownertobuyer.com</a>
        </p>
      </div>
      <div>
        <h2>Reporting a listing</h2>
        <p>
          To report a specific property — a fake listing, wrong information, or a scam attempt — use the{" "}
          <strong>Report this listing</strong> button on that property's page instead of emailing us. It reaches our
          moderation team directly and gets reviewed faster.
        </p>
      </div>
      <div>
        <h2>Response time</h2>
        <p>We aim to reply to all messages within 1–2 business days.</p>
      </div>
    </InfoPage>
  );
}
