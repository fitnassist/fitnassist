import { Link } from 'react-router-dom';
import { routes } from '@/config/routes';
import { HeroBanner } from '@/components/HeroBanner';

export const TermsOfServicePage = () => {
  return (
    <div>
      <HeroBanner title="Terms of Service" imageUrl="/images/hero-terms.jpg" size="small" />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Last updated: 22 March 2026</p>

        <div className="mt-8 space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using Fitnassist ("the platform"), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
            <p className="mt-2">
              Fitnassist is a platform that connects personal trainers with trainees. We provide
              tools for trainer discovery, profile management, messaging, and connection requests.
              We do not directly provide personal training services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to create an account.</li>
              <li>
                You may not create multiple accounts or use another person's account without
                permission.
              </li>
              <li>
                We reserve the right to suspend or terminate accounts that violate these terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Trainer Accounts</h2>
            <p className="mt-2">If you register as a personal trainer, you agree that:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                All qualifications, certifications, and credentials listed on your profile are
                accurate and current.
              </li>
              <li>You hold appropriate insurance for providing personal training services.</li>
              <li>
                You are solely responsible for the services you provide to trainees outside of the
                platform.
              </li>
              <li>
                You will respond to connection and callback requests in a timely and professional
                manner.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Trainee Accounts</h2>
            <p className="mt-2">If you register as a trainee, you agree that:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>You will use the platform respectfully and not harass or spam trainers.</li>
              <li>
                You understand that Fitnassist does not verify trainer credentials and you should
                conduct your own due diligence.
              </li>
              <li>
                Any arrangements made with trainers outside the platform are solely between you and
                the trainer.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Acceptable Use</h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Use the platform for any unlawful purpose.</li>
              <li>Post false, misleading, or deceptive information.</li>
              <li>Harass, abuse, or threaten other users.</li>
              <li>Send spam or unsolicited messages.</li>
              <li>
                Attempt to access other users' accounts or private information without
                authorisation.
              </li>
              <li>Interfere with or disrupt the platform's infrastructure.</li>
              <li>
                Scrape, crawl, or use automated means to access the platform without our consent.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Intellectual Property</h2>
            <p className="mt-2">
              The Fitnassist platform, including its design, features, and content (excluding
              user-generated content), is owned by us and protected by intellectual property laws.
              You retain ownership of content you post on the platform, but grant us a licence to
              display it as part of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Disclaimer of Warranties</h2>
            <p className="mt-2">
              The platform is provided "as is" and "as available" without warranties of any kind,
              either express or implied. We do not warrant that the platform will be uninterrupted,
              error-free, or secure. We do not endorse, verify, or guarantee any trainer listed on
              the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Limitation of Liability</h2>
            <p className="mt-2">
              To the fullest extent permitted by law, Fitnassist shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your
              use of the platform. This includes, but is not limited to, any injuries, losses, or
              damages resulting from personal training services arranged through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Termination</h2>
            <p className="mt-2">
              You may delete your account at any time through your{' '}
              <Link to={routes.dashboardSettings} className="text-coral hover:underline">
                account settings
              </Link>
              . We reserve the right to suspend or terminate your account if you violate these
              terms, with or without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Changes to Terms</h2>
            <p className="mt-2">
              We may update these Terms of Service from time to time. Continued use of the platform
              after changes are posted constitutes acceptance of the revised terms. We will notify
              users of material changes via email or platform notification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Governing Law</h2>
            <p className="mt-2">
              These terms shall be governed by and construed in accordance with the laws of England
              and Wales, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">13. Contact Us</h2>
            <p className="mt-2">
              If you have any questions about these Terms of Service, please{' '}
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
