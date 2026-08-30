import { Card, CardBody } from "@/components/ui/card";

const FEATURES = [
  {
    title: "Know what you have",
    body: "Every vial, lot number and expiry date in one list — no more counting boxes on the kitchen table.",
  },
  {
    title: "Log infusions in seconds",
    body: "Record dose, product and reason as you go. Your treatment diary builds itself.",
  },
  {
    title: "Get warned before you run out",
    body: "HackitRx projects your supply from how you actually infuse, and tells you when to reorder.",
  },
];

const STEPS = [
  "Add the vials you have at home",
  "Log each infusion as you take it",
  "Reorder before your supply runs low",
];

export function Welcome() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"></header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-16 text-center sm:py-24">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            Factor supply tracking
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Never run out of factor.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
            Track your vials, log your infusions, and get reminded before your supply runs low —
            built for people living with haemophilia.
          </p>
        </section>

        <section className="grid gap-6 pb-16 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardBody>
                <h2 className="text-sm font-semibold text-slate-900">{feature.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{feature.body}</p>
              </CardBody>
            </Card>
          ))}
        </section>

        <section id="how-it-works" className="pb-16">
          <Card>
            <CardBody className="sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                How it works
              </h2>
              <ol className="mt-4 space-y-4">
                {STEPS.map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <p className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-400">
          HackitRx is a demo project. It tracks supply and is not medical advice — talk to your
          haemophilia centre about any change to your treatment.
        </p>
      </footer>
    </div>
  );
}
