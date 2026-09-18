import { InfoPage } from "@/components/InfoPage";

export default function AboutPage() {
  return (
    <InfoPage title="About OwnerToBuyer" subtitle="Lahore's owner-direct property marketplace.">
      <p>
        OwnerToBuyer connects property buyers and renters directly with owners in Lahore, without
        unnecessary middlemen. Sellers post their properties for free; buyers browse, contact sellers directly, and
        handle the deal themselves.
      </p>
      <h2>What we are</h2>
      <p>
        We are a listings and connection platform. We give sellers a place to advertise a property and give buyers a
        way to find and contact them directly — nothing more.
      </p>
      <h2>What we are not</h2>
      <p>
        We are not a real estate agency, broker, or verification service. We do not inspect properties, verify
        ownership or documents, hold funds in escrow, or take a commission on any deal. Every transaction happens
        directly between the buyer and the seller, and both are responsible for their own due diligence — see our{" "}
        <a href="/safety">Safety / Disclaimer</a> page for details.
      </p>
      <h2>Where we operate</h2>
      <p>We currently list properties in Lahore, with plans to expand to more Pakistani cities over time.</p>
    </InfoPage>
  );
}
