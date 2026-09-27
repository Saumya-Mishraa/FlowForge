import { Link } from 'react-router-dom';
import {
  Send,
  Workflow,
  Link2,
  Globe2,
  ScrollText,
  FileJson,
  BarChart3,
  ArrowRight,
  Check,
} from 'lucide-react';

const features = [
  {
    icon: Send,
    title: 'API Testing',
    description:
      'A fast request workspace with full method support, query params, headers, auth, and a Monaco-powered JSON editor.',
  },
  {
    icon: Workflow,
    title: 'Visual Flow Designer',
    description:
      'Drag nodes onto a canvas and connect them into a real, executable API workflow — no code required.',
  },
  {
    icon: Link2,
    title: 'API Chaining',
    description:
      'Extract a value from one response and feed it straight into the next request, condition, or transform.',
  },
  {
    icon: Globe2,
    title: 'Environment Management',
    description: 'Switch between development, staging, and production variables without touching a single request.',
  },
  {
    icon: ScrollText,
    title: 'Execution Logs',
    description: 'Every run is recorded node by node, so a failed step is never a mystery.',
  },
  {
    icon: FileJson,
    title: 'OpenAPI Import',
    description: 'Bring in an existing spec and get usable requests for every documented endpoint.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Success rates, response times, and your most-used endpoints, drawn from your real traffic.',
  },
];

export default function Landing() {
  return (
    <div className="bg-white">
      <header className="flex items-center justify-between px-6 lg:px-10 h-20 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white font-display text-sm font-semibold">
            F
          </div>
          <span className="font-display text-lg font-semibold text-ink">FlowForge</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-ink-secondary hover:text-ink">
            Sign in
          </Link>
          <Link
            to="/register"
            className="h-9 px-4 inline-flex items-center rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Start Building
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-faint to-white" />
        <div className="max-w-4xl mx-auto text-center px-6 pt-20 pb-24">
          <h1 className="font-display text-5xl sm:text-6xl font-medium leading-[1.08] text-ink text-balance">
            Build. Test. Connect. Automate APIs.
          </h1>
          <p className="mt-6 text-lg text-ink-secondary max-w-2xl mx-auto leading-relaxed">
            FlowForge is a developer platform for testing REST APIs and visually wiring
            them into multi-step workflows — with real execution, real data, and full
            visibility into every run.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="h-11 px-6 inline-flex items-center gap-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Start Building <ArrowRight size={16} />
            </Link>
            <Link
              to="/register"
              className="h-11 px-6 inline-flex items-center rounded-md border border-line text-sm font-medium text-ink hover:bg-primary-faint transition-colors"
            >
              Explore Workflows
            </Link>
          </div>

          <div className="mt-16 mx-auto max-w-3xl rounded-lg border border-line bg-white shadow-card p-4 text-left">
            <div className="flex items-center gap-1.5 pb-3 border-b border-line">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/40" />
              <span className="ml-3 text-xs text-ink-secondary font-mono">
                auth-flow.workflow
              </span>
            </div>
            <div className="pt-3 space-y-2 font-mono text-sm">
              <p className="text-success">✓ Login API — 200 — 240ms</p>
              <p className="text-success">✓ Extract Token</p>
              <p className="text-success">✓ Get Profile — 200 — 180ms</p>
              <p className="text-ink-secondary">✓ Condition — TRUE</p>
              <p className="text-success">✓ Get Projects — 200 — 320ms</p>
              <p className="text-ink font-medium">Workflow completed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-xl mb-14">
          <h2 className="font-display text-3xl font-medium text-ink">
            Everything you need between a request and a working integration.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-line p-6 hover:border-primary/30 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft mb-4">
                <f.icon size={19} className="text-primary" />
              </div>
              <h3 className="font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-secondary leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-ink">
        <div className="max-w-3xl mx-auto text-center px-6 py-20">
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-white">
            Your APIs already talk to each other. Now you can see it happen.
          </h2>
          <p className="mt-4 text-white/70">
            Free to start. No credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="h-11 px-6 inline-flex items-center gap-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Create your account <ArrowRight size={16} />
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/60">
            {['No fake data', 'Real execution engine', 'Self-hostable'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check size={14} /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-ink-secondary">
        © {new Date().getFullYear()} FlowForge. Built as a portfolio project.
      </footer>
    </div>
  );
}
