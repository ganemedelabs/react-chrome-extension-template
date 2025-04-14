import { useEffect, useRef } from "react";
import { destroyPage } from "./utils/utils";
import Logo from "./components/Logo";

export default function App() {
    const timeoutIdRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const mainRef = useRef<HTMLElement | null>(null);
    const triggerRef = useRef<HTMLDivElement | null>(null);

    const duration = 2000;

    const startEffect = () => {
        timeoutIdRef.current = setTimeout(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "destroyPage" }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Error sending message:", chrome.runtime.lastError.message);
                            alert("Please open a webpage to use this feature.");
                        } else {
                            console.log("Response from content script:", response);
                        }
                    });
                }
            });
            if (mainRef.current) {
                destroyPage(mainRef.current);
            }
        }, duration);
    };

    const stopEffect = () => {
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = undefined;
        }
    };

    useEffect(() => {
        return () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, []);

    return (
        <main
            className="relative [&:has(.logo-circle:hover)_.background]:bg-red-500 flex h-screen w-screen items-center justify-center font-sans"
            ref={mainRef}
        >
            <div className="background absolute w-80 h-80 bg-secondary blur-[10rem] transition-[background-color] duration-[2000ms] ease-in-out"></div>
            <div className="z-10 flex flex-col items-center p-4 gap-4">
                <div className="[&:has(.logo-circle:hover)]:[animation:shake_300ms_infinite]">
                    <Logo
                        ref={triggerRef as React.RefObject<HTMLDivElement>}
                        onMouseEnter={startEffect}
                        onMouseLeave={stopEffect}
                    />
                </div>
                <h1 className="text-center">React Chrome Extension Template</h1>
                <p className="text-center text-lg">
                    Created by <a href="https://github.com/ganemedelabs">Ganemede Labs</a>
                </p>
                <p className="text-center text-sm">
                    <a href="https://github.com/ganemedelabs/react-chrome-extension-template">View on GitHub</a>
                </p>
            </div>
        </main>
    );
}
