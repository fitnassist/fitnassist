import { Link } from 'react-router-dom';
import { routes } from '@/config/routes';
import { HeroBanner } from '@/components/HeroBanner';

export const PrivacyPolicyPage = () => {
  return (
    <div>
      <HeroBanner title="Privacy Policy" imageUrl="/images/hero-privacy.jpg" size="small" />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Last updated: 22 March 2026</p>

        <div className="mt-8 space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p className="mt-2">
              Fitnassist ("we", "our", "us") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you
              use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <p className="mt-2">We collect information you provide directly to us, including:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Account information:</strong> name, email address, and password when you
                create an account.
              </li>
              <li>
                <strong>Profile information:</strong> for trainers, this includes bio,
                qualifications, certifications, services offered, profile photos, and location data.
              </li>
              <li>
                <strong>Communications:</strong> messages sent through the platform between trainees
                and trainers, and contact/callback requests.
              </li>
              <li>
                <strong>Newsletter subscriptions:</strong> email addresses provided for our
                newsletter.
              </li>
              <li>
                <strong>Support enquiries:</strong> name, email, and message content when you
                contact us through our support form.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              3. How We Use Your Information
            </h2>
            <p className="mt-2">We use the information we collect to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Provide, maintain, and improve our platform.</li>
              <li>Create and manage your account.</li>
              <li>Facilitate connections between trainees and personal trainers.</li>
              <li>Enable messaging and communication features.</li>
              <li>Send you service-related notifications and updates.</li>
              <li>Send newsletters if you have subscribed.</li>
              <li>Respond to your support enquiries.</li>
              <li>Monitor and analyse usage trends to improve user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Location Data</h2>
            <p className="mt-2">
              For trainers, we collect and display location information (address, postcode, and
              geographic coordinates) to enable location-based search functionality. This
              information is visible on your public profile and in search results. You can update or
              remove your location at any time through your profile settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Information Sharing</h2>
            <p className="mt-2">
              We do not sell your personal information. We may share your information in the
              following circumstances:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Public profiles:</strong> trainer profile information is publicly visible to
                all users.
              </li>
              <li>
                <strong>Connected users:</strong> when a connection is established, certain contact
                information may be shared between the trainee and trainer.
              </li>
              <li>
                <strong>Service providers:</strong> we use third-party services for email delivery,
                hosting, and analytics.
              </li>
              <li>
                <strong>Legal requirements:</strong> we may disclose information if required by law
                or in response to valid legal requests.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Data Security</h2>
            <p className="mt-2">
              We implement appropriate technical and organisational measures to protect your
              personal information. However, no method of transmission over the internet is 100%
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Access the personal information we hold about you.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Withdraw consent for marketing communications at any time.</li>
              <li>Request a copy of your data in a portable format.</li>
            </ul>
            <p className="mt-2">
              You can exercise these rights through your{' '}
              <Link to={routes.dashboardSettings} className="text-coral hover:underline">
                account settings
              </Link>{' '}
              or by contacting us through our{' '}
              <Link to={routes.support} className="text-coral hover:underline">
                support page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Cookies</h2>
            <p className="mt-2">
              We use essential cookies to maintain your session and preferences. We do not use
              third-party tracking cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the updated policy on this page with a revised "Last
              updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
            <p className="mt-2">
              If you have any questions about this Privacy Policy, please{' '}
              <Link to={routes.support} className="text-coral hover:underline">
                contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
