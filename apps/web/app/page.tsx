"use client"

import { motion, Variants } from "motion/react"
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import Link from "next/link"

import { Header } from "@/components/header"
import { HeroSection, LogosSection } from "@/components/hero"
import { Button } from "@workspace/ui/components/button"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Real-time updates with Convex. Changes sync instantly across your team.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description:
      "Enterprise-grade security with role-based access control built in.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Seamless collaboration with powerful project and task management.",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description:
      "Visual progress tracking and analytics to keep projects on schedule.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.35_0.15_264/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,oklch(0.35_0.15_264/0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,oklch(0.35_0.15_264/0.1),transparent_60%)]" />
      </div>

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-20 pb-32 sm:pt-32">
        <HeroSection />
      </section>

      {/* Logos Section */}
      <section className="relative z-10 container mx-auto px-6">
        <LogosSection />
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="relative z-10 border-t border-border bg-card/50 backdrop-blur-sm"
      >
        <div className="container mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed for modern teams
            </p>
          </motion.div>

          <motion.div
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                <motion.div
                  className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300"
                  whileHover={{ scale: 1.1 }}
                >
                  <feature.icon className="size-6" />
                </motion.div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        className="relative z-10 container mx-auto px-6 py-24"
      >
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Built for high-performing teams
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Projectify helps teams of all sizes deliver projects faster with
              better collaboration and complete visibility.
            </p>

            <motion.div
              className="mt-10 space-y-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                "Real-time collaboration with team members",
                "Track progress with visual dashboards",
                "Assign tasks and set priorities",
                "Role-based access control",
                "Mobile-ready responsive design",
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="size-6 shrink-0 text-primary" />
                  <span className="text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="mt-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Link href="/dashboard">
                <Button size="lg" className="group">
                  Get Started Now
                  <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="aspect-square overflow-hidden rounded-3xl border border-border bg-linear-to-br from-primary/20 via-card to-background p-12">
              <motion.div
                className="flex size-full flex-col items-center justify-center text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="text-6xl font-bold text-primary">128</div>
                <div className="mt-2 text-sm tracking-wider text-muted-foreground uppercase">
                  Active Projects
                </div>
                <div className="mt-8 grid w-full grid-cols-2 gap-4">
                  <motion.div
                    className="rounded-xl border border-border bg-card/50 p-4"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-2xl font-bold text-foreground">
                      96%
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      On-Time
                    </div>
                  </motion.div>
                  <motion.div
                    className="rounded-xl border border-border bg-card/50 p-4"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-2xl font-bold text-foreground">
                      4.9
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Rating
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-background p-12 text-center sm:p-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Ready to transform your workflow?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Join thousands of teams already using Projectify to ship better
            products faster.
          </p>
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <Link href="/dashboard">
                <Button size="lg" className="group h-12 px-8 text-base">
                  Get Started Free
                  <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base"
              >
                Schedule a Demo
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="size-4" />
              <span>© 2024 Projectify. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Terms
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
