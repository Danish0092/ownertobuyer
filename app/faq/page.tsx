import { InfoPage } from "@/components/InfoPage";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is it really free to post a property?",
    a: "Yes. Posting a listing on OwnerToBuyer is completely free, with no commission taken on any sale or rental you complete.",
  },
  {
    q: "Do you verify listings or sellers?",
    a: "No. We are a connection platform, not a verification service — we don't check ownership, documents, NOCs, or the accuracy of what a seller lists. Always verify everything yourself before making any payment. See our Safety / Disclaimer page.",
  },
  {
    q: "How do I contact a seller?",
    a: "Every listing has WhatsApp and Call buttons that go straight to the seller's number — there's no middleman relaying the conversation.",
  },
  {
    q: "What does \"Owner Direct\" mean?",
    a: "It means the person listing the property is the owner themselves, not a dealer or agent. You can filter search results to Owner Direct listings only.",
  },
  {
    q: "Can dealers/agents list properties too?",
    a: "Yes. When posting a listing you choose whether you're listing as an Owner or a Dealer, and that's shown on the listing so buyers know who they're dealing with.",
  },
  {
    q: "How do I edit or remove my listing?",
    a: "Go to My Properties from your account menu — every listing there has Edit and Delete actions.",
  },
  {
    q: "I think a listing is fake or a scam. What do I do?",
    a: "Click Report this listing on the property page and pick a reason. Our team reviews every report.",
  },
];

export default function FaqPage() {
  return (
    <InfoPage title="Help / FAQ" subtitle="Common questions about buying, selling, and using OwnerToBuyer.">
      {FAQS.map((item) => (
        <div key={item.q}>
          <h2>{item.q}</h2>
          <p>{item.a}</p>
        </div>
      ))}
    </InfoPage>
  );
}
