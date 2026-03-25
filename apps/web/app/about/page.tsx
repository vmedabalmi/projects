export default function AboutPage() {
  return (
    <article className="max-w-3xl mx-auto flex flex-col gap-8">
      <header>
        <h1 style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
          How Patent Expiration Works
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
          A guide to patent terms, adjustments, and why it all matters.
        </p>
      </header>

      <Section title="The basics">
        <p>
          A United States utility or plant patent filed after June 8, 1995
          expires <strong>20 years from the filing date</strong>. Design patents
          filed after May 13, 2015 expire 15 years from the grant date. These
          are the base terms, but the actual expiration can shift significantly.
        </p>
      </Section>

      <Section title="Patent Term Adjustment (PTA)">
        <p>
          The USPTO guarantees certain processing timelines. When the office
          exceeds them, the patent term is extended day-for-day. PTA is
          calculated from three sources of delay:
        </p>
        <ul className="list-disc ml-6 mt-2 flex flex-col gap-1">
          <li><strong>A Delay:</strong> Failure to take certain actions within 14 months of filing</li>
          <li><strong>B Delay:</strong> Failure to issue a patent within 3 years of filing</li>
          <li><strong>C Delay:</strong> Delays from interference, secrecy orders, or appeals</li>
        </ul>
        <p className="mt-2">
          Overlapping delays are subtracted. The net PTA days are added to the
          base term to determine the adjusted expiration.
        </p>
      </Section>

      <Section title="Patent Term Extension (PTE)">
        <p>
          Certain patents — particularly pharmaceutical and medical device
          patents — may receive additional term if the product required
          regulatory review (e.g., FDA approval) before it could be marketed.
          PTE is capped at 5 years and cannot extend the total patent life
          beyond 14 years from FDA approval.
        </p>
      </Section>

      <Section title="Maintenance fees">
        <p>
          Utility patents require maintenance fee payments at 3.5, 7.5, and
          11.5 years after grant. Missing a payment (and the 6-month grace
          period) causes the patent to expire early. This is one of the most
          common reasons patents lapse before their full term.
        </p>
      </Section>

      <Section title="Terminal disclaimers">
        <p>
          When a patent applicant files a terminal disclaimer, they agree that
          the patent will not extend beyond the term of an earlier related
          patent. This is commonly done to overcome obviousness-type double
          patenting rejections. It means the expiration date may be tied to
          another patent.
        </p>
      </Section>

      <Section title="Why this matters">
        <p>
          When a patent expires, its claims enter the public domain. Anyone
          can make, use, or sell the previously patented invention. For
          generic drug manufacturers, this is the starting gun. For technology
          companies, it removes a licensing barrier. For researchers, it opens
          new avenues of study.
        </p>
        <p className="mt-2">
          <strong>Prior Art</strong> tracks these expirations so you can plan
          ahead — whether you&apos;re a patent attorney managing a portfolio,
          an investor evaluating pharmaceutical timelines, or a researcher
          looking for newly available technology.
        </p>
      </Section>

      <Section title="Data sources">
        <p>
          All data on this site comes from public USPTO APIs:
        </p>
        <ul className="list-disc ml-6 mt-2 flex flex-col gap-1">
          <li><strong>PatentsView</strong> — patent metadata, classifications, and assignees</li>
          <li><strong>Maintenance Fee API</strong> — fee payment status and lapse information</li>
          <li><strong>Patent Center (ODP)</strong> — Patent Term Adjustment data</li>
        </ul>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-xl mb-3"
        style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
      >
        {title}
      </h2>
      <div
        className="text-base leading-relaxed flex flex-col gap-2"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {children}
      </div>
    </section>
  );
}
