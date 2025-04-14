interface LogoProps {
    ref?: React.RefObject<HTMLDivElement>;
    onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => void; // eslint-disable-line no-unused-vars
    onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void; // eslint-disable-line no-unused-vars
}

export default function Logo({ ref, onMouseEnter, onMouseLeave }: LogoProps) {
    return (
        <div
            className="logo-circle relative w-64 h-64 transition-transform duration-[2000ms] ease-in-out hover:scale-[1.2] hover:*:rotate-[360deg]"
            ref={ref}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Background */}
            <div
                className="logo-background pointer-events-none w-full h-full m-auto rounded-full rotate-0 duration-1000 transition-transform"
                style={{
                    boxShadow: "inset 0 0 0 0.8em white, 0 0 10px 1px black",
                    background: `linear-gradient(60deg, black 63.78%, transparent 63.78%),
                        linear-gradient(-60deg, black 63.78%, transparent 63.78%) 100% 0,
                        linear-gradient(60deg, transparent 36.22%, white 36.22%) 100% 100%,
                        linear-gradient(-60deg, transparent 36.22%, white 36.22%) 0% 100%,
                        white linear-gradient(black, black) 50% 100%`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "50% 50%",
                }}
            >
                <div className="absolute bg-black rounded-full top-1/2 left-1/2 -translate-1/2 w-1/2 h-1/2"></div>
            </div>

            {/* Triangle */}
            <div
                className="absolute pointer-events-none top-0 left-0 z-10 w-full h-full rounded-full"
                style={{
                    background: "linear-gradient(-60deg, black 63.78%, transparent 63.78%) 100% 0",
                    backgroundSize: "50% 50%",
                    backgroundRepeat: "no-repeat",
                }}
            >
                <div
                    className="absolute w-full h-full rounded-full"
                    style={{
                        background: "linear-gradient(-60deg, black 63.78%, transparent 63.78%) 100% 20%",
                        backgroundSize: "50% 50%",
                        backgroundRepeat: "no-repeat",
                    }}
                ></div>
            </div>

            {/* Strip */}
            <div className="absolute pointer-events-none flex w-1/2 h-[1.8rem] top-1/2 left-1/2 -translate-y-1/2 z-10">
                <div
                    className="bg-primary w-full h-full"
                    style={{
                        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 100%, 30% 0%)",
                    }}
                />
                <div className="bg-primary absolute translate-x-1/2 w-1/2 h-full" />
                <div
                    className="bg-primary w-full h-full"
                    style={{
                        clipPath: "ellipse(50% 200% at 50% 50%)",
                    }}
                />
            </div>
        </div>
    );
}
