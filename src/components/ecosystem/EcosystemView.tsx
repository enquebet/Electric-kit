import React, { useState } from 'react';
import {
  ExternalLink,
  Globe,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  Rocket,
  Users,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Cpu,
  Cloud,
  Palette,
  Megaphone,
  Database,
  Headphones,
  Briefcase,
  Award,
  ChevronRight,
  TrendingUp,
  FileText,
  Search,
  MessageSquare,
  Compass,
  ArrowRight,
  GraduationCap,
  Calendar,
  Send,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface EcosystemViewProps {
  onNavigateToTools?: () => void;
}

export const EcosystemView: React.FC<EcosystemViewProps> = ({ onNavigateToTools }) => {
  const [activeTab, setActiveTab] = useState<
    'homepage' | 'about' | 'services' | 'industries' | 'portfolio' | 'startups' | 'careers' | 'leadership' | 'contact' | 'audit'
  >('homepage');

  const [selectedServiceId, setSelectedServiceId] = useState<string>('web-app');
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>('bfsi');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('ecommerce');

  // Contact modal / form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactService, setContactService] = useState('Web & App Development');
  const [contactMessage, setContactMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) return;
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 4000);
  };

  const servicesList = [
    {
      id: 'web-app',
      name: 'Web & App Development',
      icon: Code2,
      tagline: 'Modern, high-velocity responsive web applications & custom mobile apps',
      deliverables: ['Responsive Web Apps (React, Next.js, Angular, Vue)', 'Custom B2B & B2C Client Portals', 'Scalable E-commerce Platforms', 'Cross-Platform Mobile Apps (React Native, Flutter)'],
      tech: ['Next.js', 'React', 'Node.js', 'TypeScript', 'PHP/Laravel', 'Tailwind CSS'],
      process: 'Requirements analysis, responsive UX architecture, component engineering, performance tuning, and cross-browser QA.',
    },
    {
      id: 'ai-automation',
      name: 'AI & Automation',
      icon: Cpu,
      tagline: 'Intelligent AI agents, automated workflows, and private enterprise RAG systems',
      deliverables: ['Autonomous AI Agent Workflows', 'Custom NLP & Support Chatbots', 'Retrieval-Augmented Generation (RAG)', 'Document Automation & OCR Extraction'],
      tech: ['OpenAI', 'Python', 'FastAPI', 'LangChain', 'Vector DBs', 'Gemini API'],
      process: 'Knowledge graph ingestion, prompt optimization, vector index embedding, guardrail implementation, and latency evaluation.',
    },
    {
      id: 'migration',
      name: 'Migration & Modernization',
      icon: TrendingUp,
      tagline: 'Refactoring legacy software into modular, cloud-native microservices',
      deliverables: ['Legacy Monolith to Microservices Refactoring', 'Database Schema Modernization', 'Framework & Runtime Upgrades', 'Zero-Downtime Data Cutover Strategy'],
      tech: ['AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Node.js', 'Java/Spring Boot'],
      process: 'Technical debt audit, strangler-fig migration roadmap, automated regression testing, and phased zero-downtime deployment.',
    },
    {
      id: 'cloud-devops',
      name: 'Cloud & DevOps',
      icon: Cloud,
      tagline: 'Enterprise cloud infrastructure, automated CI/CD pipelines, and 24/7 observability',
      deliverables: ['Multi-Cloud Architecture (AWS, Azure, GCP)', 'Automated CI/CD Deployment Pipelines', 'Infrastructure as Code (Terraform)', '24/7 Cloud Monitoring & Incident Alerting'],
      tech: ['AWS', 'Google Cloud', 'Microsoft Azure', 'Docker', 'GitHub Actions', 'Terraform'],
      process: 'Security hardening, container orchestration, automated canary releases, and cost-optimization audits.',
    },
    {
      id: 'ui-ux',
      name: 'UI/UX & Product Design',
      icon: Palette,
      tagline: 'Human-centered user research, atomic design systems, and clickable high-fidelity prototypes',
      deliverables: ['User Journey Mapping & Persona Research', 'Wireframes & Interactive Figma Prototypes', 'Production-Grade Design Systems & Tokens', 'Usability Testing & Accessibility (WCAG 2.1)'],
      tech: ['Figma', 'Design Tokens', 'Tailwind CSS', 'Atomic Design', 'User Testing'],
      process: 'User interviews, low-fidelity wireframing, design token definition, usability validation, and developer handoff.',
    },
    {
      id: 'marketing',
      name: 'Digital Marketing & Ads',
      icon: Megaphone,
      tagline: 'Data-driven SEO strategies, high-ROI Google & Meta ad campaigns, and conversion optimization',
      deliverables: ['Technical & On-Page SEO Audits', 'Performance Marketing (Google Ads, Meta Ads)', 'Content Marketing & Brand Copywriting', 'Conversion Rate Optimization (CRO) & Funnel Analytics'],
      tech: ['Google Ads', 'Meta Business Suite', 'Google Analytics 4', 'Ahrefs', 'Semrush'],
      process: 'Keyword research, ad creative A/B testing, landing page conversion audits, and transparent weekly ROI reporting.',
    },
    {
      id: 'data-analytics',
      name: 'Data, Analytics & Integrations',
      icon: Database,
      tagline: 'Executive business intelligence dashboards, real-time data pipelines, and ERP/CRM integrations',
      deliverables: ['Executive BI Dashboards & Visualizations', 'Custom REST & GraphQL API Gateways', 'CRM & ERP System Connectors (Salesforce, HubSpot)', 'Automated ETL & Data Cleansing Pipelines'],
      tech: ['PostgreSQL', 'Python', 'Grafana', 'PowerBI', 'REST APIs', 'GraphQL'],
      process: 'Data source cataloging, schema mapping, ETL pipeline automation, dashboard authoring, and data integrity verification.',
    },
    {
      id: 'managed-it',
      name: 'Managed IT & Support',
      icon: Headphones,
      tagline: 'Proactive system maintenance, security patches, uptime monitoring, and SLA-backed support',
      deliverables: ['Guaranteed SLA Response Times', 'Regular Security & Dependency Patching', 'Automated Daily Backups & Disaster Recovery', 'Performance & Health Monitoring (Uptime/Latency)'],
      tech: ['Grafana', 'Prometheus', 'Sentry', 'CloudWatch', 'Uptime Kuma'],
      process: 'Continuous telemetry capture, automated health checks, routine patching windows, and priority incident mitigation.',
    },
  ];

  const industriesList = [
    {
      id: 'bfsi',
      name: 'BFSI (Banking & Finance)',
      desc: 'High-security financial portals, payment gateway integrations, compliance engines, and automated fraud-detection workflows.',
      tags: ['PCI-DSS Compliance', 'Core Banking APIs', 'Payment Gateways', 'Encryption'],
    },
    {
      id: 'healthcare',
      name: 'Healthcare & HealthTech',
      desc: 'HIPAA-compliant patient portals, hospital management information systems (HMIS), telemedicine scheduling, and EHR data bridges.',
      tags: ['HIPAA Standards', 'Telemedicine', 'EHR Integration', 'Patient Portals'],
    },
    {
      id: 'retail',
      name: 'Retail & E-commerce',
      desc: 'Omnichannel shopping platforms, real-time inventory synchronization, dynamic pricing engines, and personalized recommendation feeds.',
      tags: ['Stripe / Razorpay', 'Inventory Sync', 'Headless Commerce', 'Next.js Storefronts'],
    },
    {
      id: 'education',
      name: 'Education & EdTech',
      desc: 'Interactive virtual classrooms, WebRTC live audio/video lectures, automated grading systems, and student progress tracking dashboards.',
      tags: ['WebRTC Live Classrooms', 'LMS Portals', 'Automated Assessments', 'Gamified Learning'],
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing & Industry 4.0',
      desc: 'Shop-floor IoT telemetry dashboards, predictive equipment maintenance systems, supply-chain tracking, and ERP integrations.',
      tags: ['IoT Sensor Telemetry', 'MQTT / Grafana', 'Predictive Maintenance', 'Supply Chain ERP'],
    },
    {
      id: 'realestate',
      name: 'Real Estate & PropTech',
      desc: 'Interactive map-driven property discovery engines, virtual 3D tour integrations, broker CRM management, and automated document generation.',
      tags: ['Mapbox GIS', 'Property CRM', 'Virtual Tours', 'Automated Leases'],
    },
    {
      id: 'travel',
      name: 'Travel & Hospitality',
      desc: 'Global flight and hotel booking engines, dynamic inventory reservation systems, itinerary planners, and real-time review aggregation.',
      tags: ['GDS / OTA APIs', 'Booking Engines', 'Firebase Realtime', 'Dynamic Itineraries'],
    },
    {
      id: 'media',
      name: 'Media & Entertainment',
      desc: 'High-concurrency streaming video platforms, content management systems (CMS), digital asset management (DAM), and audience analytics.',
      tags: ['HLS Video Streaming', 'CDN Optimization', 'Digital Asset Management', 'Paywalls'],
    },
    {
      id: 'government',
      name: 'Government & Public Sector',
      desc: 'Citizen service portals, digital identity verification systems, public records search, and accessible civic infrastructure.',
      tags: ['WCAG Accessibility', 'Citizen Portals', 'Aadhaar / eKYC', 'High-Security Audits'],
    },
    {
      id: 'energy',
      name: 'Energy & Utilities',
      desc: 'Grid load monitoring systems, renewable energy production analytics, smart meter telemetry ingestion, and outage reporting platforms.',
      tags: ['Smart Meter Telemetry', 'Grid Load Balancing', 'Solar / Wind Analytics', 'Utility Billing'],
    },
  ];

  const portfolioCases = [
    {
      id: 'ecommerce',
      title: 'Global High-Scale E-commerce Platform',
      category: 'Web & E-Commerce',
      stack: ['Next.js', 'Stripe', 'Tailwind CSS', 'PostgreSQL', 'Redis'],
      summary: 'Architected and built a high-speed headless e-commerce storefront capable of serving 50,000+ daily active shoppers with sub-second page loads and seamless multi-currency checkout.',
      metrics: ['+142% Checkout Conversion', '850ms Avg Page Load', '99.98% Uptime'],
      details: 'Implemented server-side rendering for optimal SEO, dynamic faceted search filters, and webhook-driven automated fulfillment pipelines.',
    },
    {
      id: 'chatbot',
      title: 'Autonomous AI Customer Support Copilot',
      category: 'AI & Automation',
      stack: ['OpenAI', 'Python', 'FastAPI', 'Pinecone', 'LangChain'],
      summary: 'Engineered an intelligent enterprise support agent capable of resolving 72% of Tier-1 customer enquiries autonomously with real-time vector knowledge base indexing.',
      metrics: ['72% Ticket Deflection', '<2s Response Time', '4.8/5 Customer CSAT'],
      details: 'Trained on company documentation with strict safety boundaries and human-in-the-loop escalation triggers for complex account disputes.',
    },
    {
      id: 'realestate',
      title: 'Geospatial Real Estate Discovery Portal',
      category: 'PropTech & Web',
      stack: ['Next.js', 'PostgreSQL', 'Mapbox GL', 'Tailwind CSS', 'Prisma'],
      summary: 'Developed a rich geospatial real estate marketplace featuring interactive vector boundary maps, neighborhood walkability metrics, and mortgage calculation utilities.',
      metrics: ['350,000+ Monthly Visitors', '45+ City Coverage', '2.4x Lead Generation'],
      details: 'Integrated PostGIS spatial indexes to deliver instant radius queries across 250,000+ verified property listings without server strain.',
    },
    {
      id: 'hospital',
      title: 'Multi-Facility Hospital Management System',
      category: 'Healthcare & Enterprise',
      stack: ['React', 'Node.js', 'AWS', 'PostgreSQL', 'Docker'],
      summary: 'Delivered an integrated hospital information system managing OPD queues, inpatient bed allocation, electronic medical records (EMR), and pharmacy inventory.',
      metrics: ['12 Facilities Connected', '40% Reduction in Patient Wait Times', 'HIPAA Ready'],
      details: 'Role-based access control (RBAC) separating doctors, nurses, pharmacists, and billing administrators with detailed audit trails.',
    },
    {
      id: 'banking',
      title: 'Digital Banking & Lending Gateway',
      category: 'BFSI & Fintech',
      stack: ['React', 'Node.js', 'AWS', 'PostgreSQL', 'PCI-DSS'],
      summary: 'Built a compliant micro-lending portal featuring instant e-KYC verification, credit scoring algorithms, and automated loan disbursement rails.',
      metrics: ['$18M+ Disbursed Safely', '3-Minute Approval Flow', 'Zero Security Incidents'],
      details: 'Encrypted end-to-end with HSM key management, webhook integrations with major banking networks, and real-time fraud telemetry.',
    },
    {
      id: 'travel',
      title: 'Real-Time Travel Booking & Reservation Platform',
      category: 'Travel & Hospitality',
      stack: ['Next.js', 'Firebase Realtime', 'Stripe', 'Tailwind CSS'],
      summary: 'Created an intuitive booking portal for boutique resorts and adventure tours with real-time room availability, calendar syncing, and review aggregation.',
      metrics: ['10,000+ Monthly Bookings', 'Zero Double-Bookings', '4.9/5 App Store Rating'],
      details: 'Leveraged Firebase real-time listeners for concurrency locking during concurrent room checkout attempts.',
    },
    {
      id: 'iot',
      title: 'Industrial Automation & IoT Telemetry Dashboard',
      category: 'Industry 4.0 & IoT',
      stack: ['React', 'Python', 'IoT MQTT', 'Grafana', 'InfluxDB'],
      summary: 'Constructed an edge IoT visualization system ingesting 10,000+ sensor telemetry points per second from factory manufacturing lines.',
      metrics: ['10,000 pts/sec Throughput', '35% Downtime Reduction', '<150ms Telemetry Latency'],
      details: 'Automated anomaly detection alerts sent directly to floor engineers via SMS and WhatsApp whenever thermal or vibration thresholds are breached.',
    },
    {
      id: 'edtech',
      title: 'Interactive EdTech & WebRTC Learning Suite',
      category: 'Education & Live Media',
      stack: ['Next.js', 'Stripe', 'WebRTC', 'Node.js', 'Socket.io'],
      summary: 'Engineered a virtual academy platform enabling synchronous multi-student video sessions, collaborative whiteboard sharing, and automated quiz evaluation.',
      metrics: ['120,000+ Enrolled Students', 'Sub-200ms Live AV Latency', '88% Course Completion'],
      details: 'Integrated adaptive bitrate video streaming and deterministic student progress analytics.',
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-16 animate-in fade-in duration-200 max-w-7xl mx-auto w-full">
      {/* =========================================================================
          FEATURED HERO DIV: "Made with cortexitsolution.com"
          Prominent, verified partner card as requested by the user
          ========================================================================= */}
      <div
        id="cortex-featured-div"
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 p-6 sm:p-8 shadow-xl shadow-cyan-950/30 transition-all hover:border-cyan-400"
      >
        {/* Decorative background glow accents */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header Row with Badge & External Link */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Globe className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Technology &amp; Development Partner
                  </span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified IT Solutions Provider
                  </span>
                </div>
                {/* User-requested exact wording: "made with cortexitsolution.com" */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
                  Made with{' '}
                  <a
                    href="https://cortexitsolution.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 hover:underline inline-flex items-center gap-1.5"
                    title="Visit cortexitsolution.com"
                  >
                    cortexitsolution.com
                    <ExternalLink className="w-5 h-5 text-cyan-400 inline" />
                  </a>
                </h1>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <a
                href="https://cortexitsolution.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-950 transition-all cursor-pointer font-mono"
              >
                <span>Visit Official Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
              </a>

              <a
                href="https://wa.me/918368710629?text=Hello%20Cortex%20IT%20Solution,%20I%20am%20interested%20in%20building%20a%20project"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 transition-all font-mono"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp: +91 83687 10629</span>
              </a>
            </div>
          </div>

          {/* Tagline & Corporate Overview */}
          <div className="bg-slate-950/70 rounded-xl p-4 sm:p-5 border border-slate-800/80">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-bold uppercase tracking-wider mb-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Tagline: &quot;Build. Scale. Modernize. Grow.&quot;</span>
            </div>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              <strong>Cortex IT Solution</strong> is an Indian IT services powerhouse delivering full-stack engineering,
              custom web &amp; mobile software, AI automation agents, cloud infrastructure &amp; DevOps, and high-conversion digital marketing.
              Born as a dedicated developer group in Patna, the firm has scaled into a multi-region technology partner with three established offices,
              empowering startups, growing SMEs, and enterprise organizations worldwide.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">100+</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Projects Delivered</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono">50+</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Global Clients</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">10+</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Industry Sectors</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">4.9 / 5</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Client Satisfaction</div>
            </div>
          </div>

          {/* Office Locations & Direct Contacts Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <strong>HQ:</strong> Faridabad (Delhi NCR)
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <strong>Branch:</strong> Patna (Regional)
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <strong>Tech Hub:</strong> Hyderabad (Bachupally)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="mailto:cortexitsolution1@gmail.com"
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                cortexitsolution1@gmail.com
              </a>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Mon–Sat, 9:30 AM–7 PM IST
              </span>
            </div>
          </div>

          {/* Interactive Trigger Banner ("If click on that take to brief info of it I've got the homepage. Now I'll go through the inner pages.") */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3 px-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-cyan-200 font-medium">
                Detailed site breakdown available: Inspect the <strong>Homepage</strong> brief and navigate through all <strong>Inner Pages</strong> below.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('inner-pages-explorer');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-mono font-semibold text-cyan-300 hover:text-cyan-100 flex items-center gap-1 bg-cyan-900/60 px-3 py-1.5 rounded-lg border border-cyan-700/60 cursor-pointer"
            >
              <span>Explore Inner Pages</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INNER PAGES INTERACTIVE EXPLORER & FULL BREAKDOWN
          The user requested: "I've got the homepage. Now I'll go through the inner pages."
          ========================================================================= */}
      <div id="inner-pages-explorer" className="flex flex-col gap-6">
        {/* Navigation Tabs Bar for Pages */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
                Cortex IT Solution — Site Breakdown &amp; Inner Pages Explorer
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Select any section to inspect the full page content &amp; structure
            </span>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80">
            {[
              { id: 'homepage', label: '1. Homepage', icon: Globe },
              { id: 'about', label: '2. /about', icon: Users },
              { id: 'services', label: '3. /services (8 Core)', icon: Code2 },
              { id: 'industries', label: '4. /industries (10)', icon: Building2 },
              { id: 'portfolio', label: '5. /portfolio (8 Cases)', icon: Briefcase },
              { id: 'startups', label: '6. /startups & MVP', icon: Rocket },
              { id: 'careers', label: '7. /careers', icon: GraduationCap },
              { id: 'leadership', label: '8. /founder & team', icon: Award },
              { id: 'contact', label: '9. /contact & Booking', icon: Phone },
              { id: 'audit', label: '10. Site Insights & Audit', icon: Lightbulb },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            TAB 1: HOMEPAGE (/)
            ========================================================================= */}
        {activeTab === 'homepage' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Page Breakdown • / (Homepage)
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  Homepage Structure, Value Proposition &amp; Hero Highlights
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  The homepage presents Cortex IT Solution as an agile, enterprise-grade development partner focusing on end-to-end execution.
                </p>
              </div>

              {/* Hero Carousel Slides Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 mb-3 border border-cyan-800/40">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Slide 1: Web &amp; App Development</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Custom web applications, responsive websites, e-commerce storefronts, and multi-tenant portals designed for high scale.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center text-blue-400 mb-3 border border-blue-800/40">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Slide 2: AI &amp; Cloud Modernization</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    AI agent workflows, enterprise RAG pipelines, legacy cloud migration, and automated CI/CD DevOps infrastructure.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-800/40">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Slide 3: Careers &amp; Team Growth</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Empowering top engineering talent across Hyderabad, Faridabad, and Patna with challenging global customer engagements.
                  </p>
                </div>
              </div>

              {/* "Trusted By" Client Logos */}
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  &quot;Trusted By&quot; Partner &amp; Client Ecosystem
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {['AvenPure', 'Enquebet', 'Quebet AI', 'Career GPS', 'Venopai', 'Hydevent Decor'].map((brand) => (
                    <div
                      key={brand}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-medium text-slate-300 flex items-center gap-2 shadow-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>{brand}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Engagement Models & 4-Step Process */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 3 Engagement Models */}
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    Three Engagement Models
                  </h4>
                  <div className="flex flex-col gap-2.5">
                    <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs">
                      <strong className="text-cyan-300 block">1. Project-Based Delivery:</strong>
                      <span className="text-slate-400">
                        Fixed-scope, milestone-driven quotes with defined deliverables, explicit timelines, and predictable budgets.
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs">
                      <strong className="text-sky-300 block">2. Dedicated Engineering Team:</strong>
                      <span className="text-slate-400">
                        Autonomous senior pods embedded directly into client sprints, scaling velocity without recruitment overhead.
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs">
                      <strong className="text-blue-300 block">3. Ongoing Managed Support:</strong>
                      <span className="text-slate-400">
                        Continuous SLA-backed maintenance, security vulnerability patching, uptime monitoring, and iterative enhancements.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-Step Process */}
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-emerald-400" />
                    The 4-Step Execution Framework
                  </h4>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs">
                      <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-800/50">
                        1
                      </span>
                      <div>
                        <strong className="text-slate-200">Tell Us:</strong>
                        <p className="text-slate-400">Initial discovery session to capture technical requirements, timeline constraints, and commercial goals.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs">
                      <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-800/50">
                        2
                      </span>
                      <div>
                        <strong className="text-slate-200">Plan:</strong>
                        <p className="text-slate-400">Architecture blueprinting, tech stack selection, milestone breakdowns, and risk modeling.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs">
                      <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-800/50">
                        3
                      </span>
                      <div>
                        <strong className="text-slate-200">Build:</strong>
                        <p className="text-slate-400">High-velocity agile development with weekly synchronous updates and continuous test coverage.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs">
                      <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-800/50">
                        4
                      </span>
                      <div>
                        <strong className="text-slate-200">Launch &amp; Scale:</strong>
                        <p className="text-slate-400">Production deployment, load monitoring, telemetry analytics, and ongoing optimization.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantees & Free Consultation CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-800/50">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Guarantees: Senior Team (No Juniors) • Transparent Pricing • Weekly Updates
                  </div>
                  <p className="text-xs text-slate-300">
                    Book a free 30-minute technical architecture consultation to review your product roadmap.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-colors shadow-md cursor-pointer whitespace-nowrap"
                >
                  Book 30-Min Consultation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: /about (About Us)
            ========================================================================= */}
        {activeTab === 'about' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Page Breakdown • /about
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  About Cortex IT Solution — Story, Values &amp; Modernization Path
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  The journey from an ambitious developer collective in Patna to an enterprise software partner across 3 hubs.
                </p>
              </div>

              {/* Origin Story & Founders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    Our Story &amp; Growth
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cortex IT Solution began in Patna as a group of passionate software engineers building custom solutions for regional businesses.
                    By focusing on engineering rigor, transparent billing, and zero reliance on junior trainees for core deliverables, the company expanded
                    rapidly, establishing regional headquarters in Faridabad (Delhi NCR) and a modern tech hub in Hyderabad (Bachupally).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <h4 className="text-sm font-bold text-sky-300 flex items-center gap-2">
                    <Award className="w-4 h-4 text-sky-400" />
                    Mission &amp; Vision
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Mission:</strong> Make modern, resilient technology accessible and practical for businesses at all stages of growth—from student founders to multi-million dollar enterprises.<br />
                    <strong>Vision:</strong> Serve as the permanent, trusted technology co-pilot from first prototype launch to high-concurrency international expansion.
                  </p>
                </div>
              </div>

              {/* Six Guiding Values */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold text-slate-200">Six Core Company Values</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { title: '1. Partnership First', desc: 'We align incentives with long-term client success rather than transactional hourly billing.' },
                    { title: '2. Quality Over Speed', desc: 'Disciplined code reviews, test-driven validation, and resilient architecture prevent costly rework.' },
                    { title: '3. Full Transparency', desc: 'Direct access to senior developers, transparent milestone accounting, and zero hidden licensing fees.' },
                    { title: '4. Practical Innovation', desc: 'Deploying AI and modern cloud tools where they drive tangible ROI, avoiding speculative tech hype.' },
                    { title: '5. People Matter', desc: 'Investing in continuous engineer upskilling, psychological safety, and flexible working conditions.' },
                    { title: '6. Long-Term Growth', desc: 'Architecting modular software ready for continuous expansion without requiring full platform rewrites.' },
                  ].map((val) => (
                    <div key={val.title} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                      <strong className="text-cyan-400 block mb-1">{val.title}</strong>
                      <span className="text-slate-400 leading-relaxed">{val.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6-Stage Modernization Path */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  The 6-Stage Modernization Framework
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-cyan-400 font-mono font-bold block mb-1">Step 1</span>
                    <strong className="text-slate-200 block">Audit</strong>
                    <span className="text-[10px] text-slate-400">Deep codebase inspection</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-cyan-400 font-mono font-bold block mb-1">Step 2</span>
                    <strong className="text-slate-200 block">Plan</strong>
                    <span className="text-[10px] text-slate-400">Migration &amp; cloud roadmap</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-cyan-400 font-mono font-bold block mb-1">Step 3</span>
                    <strong className="text-slate-200 block">Build/Migrate</strong>
                    <span className="text-[10px] text-slate-400">Modular refactoring</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-cyan-400 font-mono font-bold block mb-1">Step 4</span>
                    <strong className="text-slate-200 block">Automate</strong>
                    <span className="text-[10px] text-slate-400">CI/CD &amp; AI pipelines</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-cyan-400 font-mono font-bold block mb-1">Step 5</span>
                    <strong className="text-slate-200 block">Optimize</strong>
                    <span className="text-[10px] text-slate-400">Latency &amp; cost trim</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-cyan-400 font-mono font-bold block mb-1">Step 6</span>
                    <strong className="text-slate-200 block">Scale</strong>
                    <span className="text-[10px] text-slate-400">High-concurrency growth</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: /services (8 Core Services)
            ========================================================================= */}
        {activeTab === 'services' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Page Breakdown • /services &amp; Sub-Pages
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  8 Core Engineering &amp; IT Service Verticals
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Each service follows Cortex&apos;s standardized 6-step lifecycle: Discover ➔ Strategy ➔ Design ➔ Build ➔ Launch ➔ Scale.
                </p>
              </div>

              {/* Service Selection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {servicesList.map((srv) => {
                  const SrvIcon = srv.icon;
                  const isSelected = selectedServiceId === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServiceId(srv.id)}
                      className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-500 shadow-md shadow-cyan-950 text-cyan-200'
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-cyan-400'}`}>
                        <SrvIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold leading-tight">{srv.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Service Detailed View */}
              {(() => {
                const cur = servicesList.find((s) => s.id === selectedServiceId) || servicesList[0];
                const CurIcon = cur.icon;
                return (
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                        <CurIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-100">{cur.name}</h4>
                        <p className="text-xs text-cyan-400 font-mono">{cur.tagline}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                          Key Deliverables
                        </span>
                        <ul className="flex flex-col gap-1.5 text-xs text-slate-300">
                          {cur.deliverables.map((d, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div>
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                            Technology Stack
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {cur.tech.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                            Standard 6-Step Delivery
                          </span>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cur.process}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: /industries (10 Verticals)
            ========================================================================= */}
        {activeTab === 'industries' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Page Breakdown • /industries
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  10 Key Industry Verticals Served
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Tailored domain engineering meeting rigorous regulatory, compliance, and latency requirements.
                </p>
              </div>

              {/* Industry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {industriesList.map((ind) => {
                  const isSelected = selectedIndustryId === ind.id;
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => setSelectedIndustryId(ind.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200">{ind.name}</div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{ind.desc}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ind.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">
                            {t}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Industry Details */}
              {(() => {
                const ind = industriesList.find((i) => i.id === selectedIndustryId) || industriesList[0];
                return (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                    <h4 className="text-sm font-bold text-cyan-300">
                      Domain Focus: {ind.name}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{ind.desc}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ind.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/50 text-xs font-mono text-cyan-300"
                        >
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: /portfolio (8 Case Studies)
            ========================================================================= */}
        {activeTab === 'portfolio' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Page Breakdown • /portfolio
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  8 Real-World Production Case Studies
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Detailed summaries of the 8 signature projects built and delivered by the Cortex IT Solution team.
                </p>
              </div>

              {/* Portfolio Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {portfolioCases.map((cs) => {
                  const isSelected = selectedCaseId === cs.id;
                  return (
                    <button
                      key={cs.id}
                      type="button"
                      onClick={() => setSelectedCaseId(cs.id)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-500 shadow-md shadow-cyan-950 text-cyan-200'
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                          {cs.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 mt-2 leading-snug">{cs.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cs.stack.slice(0, 3).map((st) => (
                          <span key={st} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">
                            {st}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Case Study Spotlight */}
              {(() => {
                const cs = portfolioCases.find((c) => c.id === selectedCaseId) || portfolioCases[0];
                return (
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-mono text-cyan-400">{cs.category}</span>
                        <h4 className="text-lg font-bold text-slate-100">{cs.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cs.stack.map((st) => (
                          <span
                            key={st}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{cs.summary}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{cs.details}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      {cs.metrics.map((m, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                          <span className="text-sm font-bold text-cyan-300 font-mono block">{m}</span>
                          <span className="text-[10px] text-slate-400">Verified Client Impact</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: /startups & Student Founders
            ========================================================================= */}
        {activeTab === 'startups' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Page Breakdown • /startups
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  Startups, Student Founders &amp; Rapid MVP Acceleration
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Empowering non-technical and early-stage founders to turn ideas into investor-ready software in 4 weeks.
                </p>
              </div>

              {/* 3 Core Startup Offerings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">Tier 1</span>
                  <h4 className="text-sm font-bold text-slate-100">Student Innovator MVP</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Interactive clickable Figma prototypes, system architecture schematics, database schemas, and investor pitch deck technical slides.
                  </p>
                  <span className="text-[11px] font-mono text-emerald-400 mt-2">Special College ID Pricing</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-xs font-mono font-bold text-sky-400">Tier 2</span>
                  <h4 className="text-sm font-bold text-slate-100">Pre-Seed Product Sprint</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Working production v1 software delivered within 4 weeks. Includes responsive frontend, secure authentication, API backend, and cloud hosting.
                  </p>
                  <span className="text-[11px] font-mono text-cyan-400 mt-2">4-Week Guaranteed Delivery</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400">Tier 3</span>
                  <h4 className="text-sm font-bold text-slate-100">Fractional CTO &amp; Review</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Senior technical leadership on retainer: evaluate architecture, conduct vendor code audits, run technical interviews, and guide fundraising tech diligence.
                  </p>
                  <span className="text-[11px] font-mono text-slate-300 mt-2">Flexible Retainer Basis</span>
                </div>
              </div>

              {/* Founder Guarantees Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-bold text-emerald-400 font-mono">0% Equity</div>
                  <div className="text-[11px] text-slate-400">Zero Cap Table Dilution</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-bold text-cyan-400 font-mono">100% IP</div>
                  <div className="text-[11px] text-slate-400">You Own All Code</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-bold text-sky-400 font-mono">Strict NDA</div>
                  <div className="text-[11px] text-slate-400">Signed Prior to Discovery</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-bold text-amber-400 font-mono">Cloud Credits</div>
                  <div className="text-[11px] text-slate-400">AWS / GCP Application Help</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: /careers
            ========================================================================= */}
        {activeTab === 'careers' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Page Breakdown • /careers
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  Careers &amp; Engineering Culture
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Join a high-growth team operating across Hyderabad, Faridabad, and Patna.
                </p>
              </div>

              {/* Perks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-xs font-bold text-cyan-300">Technical Ownership</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Lead architectural choices on real enterprise systems.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-xs font-bold text-sky-300">Learning Budget</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Annual stipends for certifications, books, and courses.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-xs font-bold text-blue-300">Flexible Remote</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Hybrid office hubs or remote work setups.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-xs font-bold text-emerald-300">Health Cover</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Comprehensive medical protection for you and family.</p>
                </div>
              </div>

              {/* Open Positions List */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-sm font-bold text-slate-200">Current Open Roles (Hyderabad / Remote)</h4>
                {[
                  { role: 'Senior Full-Stack Developer', tech: 'React, Next.js, Node.js, TypeScript', loc: 'Hyderabad / Hybrid' },
                  { role: 'AI / ML Engineer', tech: 'Python, FastAPI, OpenAI, LangChain, Vector DBs', loc: 'Hyderabad / Hybrid' },
                  { role: 'Cloud & DevOps Engineer', tech: 'AWS, Docker, Kubernetes, Terraform, CI/CD', loc: 'Hyderabad / Faridabad' },
                  { role: 'UI / UX Designer', tech: 'Figma, Design Systems, WCAG, User Research', loc: 'Hyderabad / Remote' },
                  { role: 'Digital Marketing Specialist', tech: 'SEO, Google Ads, Meta Ads, GA4', loc: 'Faridabad / Remote' },
                  { role: 'Business Development Executive', tech: 'B2B Sales, Lead Gen, Tech Solutions', loc: 'Hyderabad / Patna' },
                ].map((job) => (
                  <div
                    key={job.role}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div>
                      <strong className="text-slate-100 text-sm">{job.role}</strong>
                      <div className="text-slate-400 font-mono mt-0.5">{job.tech}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400">{job.loc}</span>
                      <a
                        href="mailto:cortexitsolution1@gmail.com?subject=Job%20Application%20at%20Cortex"
                        className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800/60 font-mono font-semibold"
                      >
                        Apply via Email
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 8: /founder & /co-founder
            ========================================================================= */}
        {activeTab === 'leadership' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Page Breakdown • /founder &amp; /co-founder
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  Executive Leadership Team
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Meet the visionary engineering founders leading Cortex IT Solution.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Founder Profile */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-mono font-bold text-lg">
                      BK
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-100">Beauty Kumari</h4>
                      <span className="text-xs font-mono text-cyan-400">Founder &amp; Chief Executive Officer</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Over a decade of enterprise software engineering experience across PHP/Laravel, Angular, Java/Spring Boot, and AWS.
                    Her vision extends beyond writing code to building durable, high-impact business systems that scale gracefully.
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">Core Competencies:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Laravel', 'Angular', 'Spring Boot', 'AWS Architecture', 'REST APIs', 'Enterprise AI'].map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-slate-900 text-[11px] font-mono text-cyan-300 border border-slate-800">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Co-Founder Profile */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400 font-mono font-bold text-lg">
                      MK
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-100">Muskan Kumar</h4>
                      <span className="text-xs font-mono text-blue-400">Co-Founder &amp; Engineering Lead</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Specialized in applied AI platforms, scalable distributed software engineering, product innovation, and startup acceleration.
                    Maintains active presence across GitHub, LinkedIn, and personal engineering publications.
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">Official Portfolio &amp; Links:</span>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <a
                        href="https://muskankumar.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-slate-900 text-blue-300 hover:text-blue-200 border border-slate-800 flex items-center gap-1"
                      >
                        muskankumar.in <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 9: /contact & Booking
            ========================================================================= */}
        {activeTab === 'contact' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Page Breakdown • /contact
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  Contact Hub, Office Details &amp; 30-Min Booking
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Connect with the Cortex engineering team for project quotes, partnership discussions, or talent enquiries.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Office Info & Fast Contact Cards */}
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      Physical Office Hubs
                    </h4>
                    <div className="flex flex-col gap-2 text-xs text-slate-300">
                      <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                        <strong className="text-cyan-300 block">Faridabad Headquarters:</strong>
                        <span className="text-slate-400">Delhi NCR Central Operations &amp; Commercial Hub</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                        <strong className="text-sky-300 block">Patna Regional Center:</strong>
                        <span className="text-slate-400">Engineering Foundation &amp; Regional Outreach Branch</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                        <strong className="text-blue-300 block">Hyderabad Innovation Center:</strong>
                        <span className="text-slate-400">Bachupally Tech Hub (Primary Engineering Office)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5 text-xs">
                    <h4 className="text-sm font-bold text-slate-200">Direct Inquiries</h4>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <a href="mailto:cortexitsolution1@gmail.com" className="text-cyan-400 hover:underline">
                        cortexitsolution1@gmail.com
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <a href="tel:+918368710629" className="hover:underline">
                        +91 83687 10629
                      </a>
                      <span className="text-emerald-400 font-mono text-[10px]">(WhatsApp Active)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Mon–Sat: 9:30 AM – 7:00 PM IST
                    </div>
                  </div>
                </div>

                {/* Instant Consultation Booking Form */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Send className="w-4 h-4 text-cyan-400" />
                    Request 30-Minute Architecture Consultation
                  </h4>

                  {formSubmitted ? (
                    <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Inquiry Received!
                      </div>
                      <p>Thank you, {contactName || 'Client'}. A senior technical architect from Cortex will reply within 24 hours.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Your Name / Organization</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Alex Sharma, Founder"
                          className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="alex@company.com"
                          className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Service Interest</label>
                        <select
                          value={contactService}
                          onChange={(e) => setContactService(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                        >
                          {servicesList.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                          <option value="Startup MVP Sprint">Startup MVP Sprint (4-Week)</option>
                          <option value="Fractional CTO Consultation">Fractional CTO Consultation</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Project Summary / Scope</label>
                        <textarea
                          rows={3}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Briefly describe your application, users, timeline, or legacy migration goals..."
                          className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Consultation Request</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 10: Site Insights & Engineering Audit ("Things Noticed")
            ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
              <div>
                <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                  Site Analysis • Things Noticed &amp; Quality Observations
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  Independent Technical Review of cortexitsolution.com
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Constructive assessment of the current production site based on user observations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: '1. Service Sub-Page Depth',
                    observation: 'Service sub-pages currently repeat the one-line description from the services index.',
                    recommendation: 'Expand with detailed tech stack matrix, concrete deliverables, architecture diagrams, and service-specific FAQs.',
                    status: 'Enhancement Opportunity',
                  },
                  {
                    title: '2. Careers "How We Hire" Copy',
                    observation: 'The careers hiring section reuses the project delivery process text (Discover, Strategy, Design...).',
                    recommendation: 'Replace with recruitment-specific stages: Screening Call, Technical Problem Solving, Architecture Deep Dive, and Offer.',
                    status: 'Content Polish',
                  },
                  {
                    title: '3. Team Attribution & Leadership Page',
                    observation: 'Blog articles cite a CTO and various engineering authors not listed on the core About page.',
                    recommendation: 'Publish a unified Engineering Team directory with roles, bios, and LinkedIn profiles for credibility.',
                    status: 'Trust Building',
                  },
                  {
                    title: '4. Social Link & Handle Alignment',
                    observation: 'Footer LinkedIn links to personal profile; X handle contains alternate spelling ("CortexITSolutuo").',
                    recommendation: 'Verify verified company page URLs and claim consistent corporate handles across all networks.',
                    status: 'Brand Governance',
                  },
                  {
                    title: '5. Positioning Synergy',
                    observation: '"Senior team only, no juniors" sits alongside student-friendly MVP pricing positioning.',
                    recommendation: 'Clarify that senior architects lead all client deliverables while mentorship programs nurture student founders.',
                    status: 'Positioning Nuance',
                  },
                  {
                    title: '6. Blog Publishing Cadence',
                    observation: 'Blog claims "Updated Weekly" with 120+ articles, but latest listed posts date to August 2026.',
                    recommendation: 'Automate weekly publishing pipeline or update the label to "Curated Engineering Insights".',
                    status: 'Editorial Cadence',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-amber-900/50">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      <strong className="text-slate-300">Observation: </strong>
                      {item.observation}
                    </div>
                    <div className="text-xs text-cyan-300">
                      <strong className="text-cyan-400">Recommendation: </strong>
                      {item.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Return to Calculators / Tools Button */}
      {onNavigateToTools && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={onNavigateToTools}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <span>Return to Engineering Calculation Suite</span>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      )}
    </div>
  );
};
