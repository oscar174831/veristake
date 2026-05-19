import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal"
};

const disclaimer = "This is a placeholder for founder + counsel review. Do not consider this binding.";

export default function LegalPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Draft legal notices</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal">Legal</h1>
        <div className="mt-8 space-y-8">
          <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Terms of Use</h2>
            <p className="mt-2 italic text-slate-600 dark:text-slate-300">{disclaimer}</p>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Draft - pending legal review. Veristake demo materials are provided for product
              evaluation only and should not be treated as legal, insurance, financial, or compliance advice.
            </p>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Privacy Notice</h2>
            <p className="mt-2 italic text-slate-600 dark:text-slate-300">{disclaimer}</p>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Draft - pending legal review. The site may use privacy-respecting analytics and Sentry
              error reporting when configured. Demo events avoid intentionally collecting personal
              claim, wallet, or health information.
            </p>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Responsible Disclosure</h2>
            <p className="mt-2 italic text-slate-600 dark:text-slate-300">{disclaimer}</p>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Draft - pending legal review. Security findings can be sent to founder@veristake.com
              until a dedicated security contact is published.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
