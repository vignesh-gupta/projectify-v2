import { FolderKanban } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen overflow-hidden bg-background">
			{/* Animated background gradient */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.35_0.15_264/0.15),transparent_50%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,oklch(0.35_0.15_264/0.08),transparent_50%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,oklch(0.35_0.15_264/0.1),transparent_60%)]" />
			</div>

			{/* Header */}
			<header className="sticky top-0 z-50 w-full border-b border-transparent">
				<nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
					<Link href="/" className="p-2 transition-colors hover:bg-accent">
						<div className="flex items-center gap-2">
							<div className="flex size-6 items-center justify-center bg-primary">
								<FolderKanban className="size-3.5 text-primary-foreground" />
							</div>
							<span className="text-sm font-bold">PROJECTIFY</span>
						</div>
					</Link>
				</nav>
			</header>

			{/* Main content */}
			<main className="relative z-10 flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6">
				{children}
			</main>
		</div>
	);
}
