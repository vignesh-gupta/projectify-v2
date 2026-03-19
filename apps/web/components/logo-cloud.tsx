import { cn } from "@workspace/ui/lib/utils"
import { InfiniteSlider } from "./infinite-slider"

type Logo = {
  src: string
  alt: string
  width?: number
  height?: number
}

type LogoCloudProps = React.ComponentProps<"div"> & {
  logos: Logo[]
}

export function LogoCloud({ className, logos, ...props }: LogoCloudProps) {
  return (
    <div
      {...props}
      className={cn(
        "overflow-hidden mask-[linear-gradient(to_right,transparent,black,transparent)] py-4",
        className
      )}
    >
      <InfiniteSlider gap={42} reverse speed={4} speedOnHover={6}>
        {logos.map((logo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={logo.alt}
            className="pointer-events-none h-4 select-none md:h-5 dark:brightness-0 dark:invert"
            height={logo.height}
            key={`logo-${logo.alt}`}
            loading="lazy"
            src={logo.src}
            width={logo.width}
          />
        ))}
      </InfiniteSlider>
    </div>
  )
}
